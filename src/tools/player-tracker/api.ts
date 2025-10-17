const DDNET_API = "https://master1.ddnet.org/ddnet/15/servers.json";

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
export async function fetchServers(): Promise<ServersData> {
    const res = await fetch(DDNET_API);
    if (!res.ok) throw new Error("无法获取 DDNet 服务器数据");
    return await res.json();
}

/**
 * 将 FoundPlayer 转换为 PlayerItem
 */
export function convertFoundPlayerToPlayerItem(foundPlayer: FoundPlayer): PlayerItem {
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
        isOnline: true // 从 API 查询到的都是在线玩家
    };
}

/**
 * 查询指定玩家是否在线
 * @param playerNames 玩家名数组
 */
export async function findPlayerByNames(playerNames: string[]): Promise<Array<PlayerItem>> {
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

            const onlinePlayer = info.clients.find(player =>
                player && player.name && playerNames.includes(player.name)
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