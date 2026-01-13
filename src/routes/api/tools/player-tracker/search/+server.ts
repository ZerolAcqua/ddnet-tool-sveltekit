import { json, type RequestEvent } from '@sveltejs/kit';

const DDNET_API = 'https://master1.ddnet.org/ddnet/15/servers.json';

// 类型声明
export interface Player {
  name: string;
  score?: number;
  skin?: { name?: string };
  team?: number;
  afk?: boolean;
}

export interface ServerInfo {
  name: string;
  map?: { name?: string };
  clients: Player[];
}

export interface Server {
  info?: ServerInfo;
  addresses?: string[];
  community?: string;
  location?: string;
}

export interface ServersData {
  servers?: Server[];
}

export interface FoundPlayer {
  player: string;
  server: string;
  serverAddr: string;
  map: string;
  location: string;
  score: number;
  skin: string;
  team: number;
  afk: string;
}

export interface PlayerItem {
  player: string;
  server?: string;
  serverAddr?: string;
  map?: string;
  location?: string;
  score?: number;
  skin?: string;
  team?: number;
  afk?: string;
  isOnline?: boolean;
}

/**
 * 获取 DDNet 全服数据
 */
async function fetchServers(): Promise<ServersData> {
  // 使用带超时与重试的 fetch 封装，避免因短暂网络抖动导致整个请求失败
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 5000; // 每次请求的超时时间

  async function fetchWithTimeout(url: string, timeoutMs: number) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  let lastError: any = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(DDNET_API, TIMEOUT_MS);
      if (!res.ok) throw new Error('无法获取 DDNet 服务器数据: HTTP ' + res.status);
      return await res.json();
    } catch (err: any) {
      lastError = err;
      // 对短暂网络错误进行指数退避
      const backoff = 200 * Math.pow(2, attempt - 1);
      const errType = err?.name || err?.constructor?.name || typeof err;
      const errMsg = err?.message || String(err);
      console.warn(`fetchServers ${attempt} failed: [${errType}] ${errMsg}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  // 所有尝试失败，抛出最近的错误
  throw lastError || new Error('无法获取 DDNet 服务器数据');
}

/**
 * 将 FoundPlayer 转换为 PlayerItem
 */
function convertFoundPlayerToPlayerItem(foundPlayer: FoundPlayer): PlayerItem {
  return {
    player: foundPlayer.player,
    server: foundPlayer.server,
    serverAddr: foundPlayer.serverAddr,
    map: foundPlayer.map,
    location: foundPlayer.location,
    score: foundPlayer.score,
    skin: foundPlayer.skin,
    team: foundPlayer.team,
    afk: foundPlayer.afk,
    isOnline: true, // 从 API 查询到的都是在线玩家
  };
}

/**
 * 查询指定玩家是否在线
 * @param playerNames 玩家名数组
 */
async function findPlayerByNames(playerNames: string[]): Promise<Array<PlayerItem>> {
  const foundPlayers: Array<FoundPlayer> = [];
  try {
    const serversData = await fetchServers();
    const servers = serversData.servers || [];

    if (!Array.isArray(servers)) {
      console.error('API 返回的数据不是数组:', servers);
      throw new Error('服务器数据格式错误');
    }

    for (const server of servers) {
      if (!server || !server.info) continue;
      const { info } = server;
      if (!info.clients || !Array.isArray(info.clients)) continue;

      const onlinePlayer = info.clients.find(
        (player) => player && player.name && playerNames.includes(player.name)
      );

      if (onlinePlayer) {
        const address = server.addresses?.[0] || 'unknown';
        const match = address.match(/\/\/([\d.]+:\d+)/); // 提取 ip:port
        const ipPort = match ? match[1] : 'unknown';

        foundPlayers.push({
          player: onlinePlayer.name,
          server: info.name,
          serverAddr: ipPort,
          map: info.map?.name || 'unknown',
          location: server.location || 'unknown',
          score: onlinePlayer.score || 0,
          skin: onlinePlayer.skin?.name || 'default',
          team: onlinePlayer.team || 0,
          afk: onlinePlayer.afk ? 'Yes' : 'No',
        });
      }
    }
  } catch (error) {
    console.error('查询玩家失败:', error);
    throw error;
  }

  // 将 FoundPlayer 转换为 PlayerItem
  return foundPlayers.map(convertFoundPlayerToPlayerItem);
}

export const POST = async ({ request }: RequestEvent) => {
  try {
    const { playerNames } = await request.json();

    if (!Array.isArray(playerNames) || playerNames.length === 0) {
      return json({ success: false, message: '请提供要查询的玩家名单' }, { status: 400 });
    }

    // 验证玩家名
    const validPlayerNames = playerNames.filter(
      (name) => typeof name === 'string' && name.trim().length > 0
    );

    if (validPlayerNames.length === 0) {
      return json({ success: false, message: '没有有效的玩家名' }, { status: 400 });
    }

    const players = await findPlayerByNames(validPlayerNames);

    return json({
      success: true,
      players,
    });
  } catch (error: any) {
    console.error('查询玩家失败:', error);

    // 检测是否为网络相关错误（超时/连接失败），并返回 502 表示上游服务不可达
    const isNetworkError =
      error &&
      (error.name === 'AbortError' ||
        (error.code && error.code === 'ETIMEDOUT') ||
        (typeof error.message === 'string' &&
          (error.message.includes('timed out') || error.message.includes('fetch'))));

    if (isNetworkError) {
      return json({ success: false, message: '无法连接到 DDNet API，请稍后重试' }, { status: 502 });
    }

    return json({ success: false, message: '查询失败，请稍后重试' }, { status: 500 });
  }
};
