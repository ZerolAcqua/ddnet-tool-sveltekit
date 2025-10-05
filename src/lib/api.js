// src/lib/api.js

const DDNET_API = "https://master1.ddnet.org/ddnet/15/servers.json";

/**
 * 获取 DDNet 全服数据
 */
export async function fetchServers() {
    const res = await fetch(DDNET_API);
    if (!res.ok) throw new Error("无法获取 DDNet 服务器数据");
    return await res.json();
}

/**
 * 查询指定玩家是否在线
 * @param {string[]} playerNames - 玩家名数组
 */
export async function findPlayerByNames(playerNames) {
    const foundPlayers = [];
    try {
        const serversData = await fetchServers();
        const servers = serversData.servers || [];
        
        // 检查返回的数据是否是数组
        if (!Array.isArray(servers)) {
            console.error('API 返回的数据不是数组:', servers);
            throw new Error('服务器数据格式错误');
        }

        // 使用 for...of 来确保异步操作按顺序执行
        for (const server of servers) {
            // 确保服务器有 info 属性
            if (!server || !server.info) {
                continue;
            }
            
            const { info } = server;
            
            // 确保 clients 存在且是数组
            if (!info.clients || !Array.isArray(info.clients)) {
                continue;
            }

            // 查找每个服务器中的在线玩家
            const onlinePlayer = info.clients.find(player =>
                player && player.name && playerNames.includes(player.name)
            );

            if (onlinePlayer) {
                foundPlayers.push({
                    player: onlinePlayer.name,
                    server: info.name,
                    map: info.map?.name || '未知地图',
                    location: server.location || '未知位置',
                    score: onlinePlayer.score || 0,
                    skin: onlinePlayer.skin?.name || '默认皮肤',
                    team: onlinePlayer.team || 0,
                    afk: onlinePlayer.afk ? 'Yes' : 'No',
                });
            }
        }
    } catch (error) {
        console.error('查询玩家失败:', error);
        throw error;
    }

    return foundPlayers;
}