const redis = require("redis");

const redisClient = redis.createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_STRING,
        port: process.env.REDIS_PORT_NO
    },
    // Add retry strategy for connection issues
    retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with an error
            console.error('Redis connection refused. Please check if Redis server is running.');
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with an error
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // Reconnect after increasing delay
        return Math.min(options.attempt * 100, 3000);
    }
});

// Handle Redis connection events
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
    // Don't crash the application on Redis errors
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

redisClient.on('reconnecting', () => {
    console.log('Redis Client Reconnecting...');
});

// Graceful handling of Redis operations when connection is down
const safeRedisOperation = async (operation, ...args) => {
    try {
        return await operation(...args);
    } catch (error) {
        console.error(`Redis operation failed: ${error.message}`);
        return null; // Return null instead of throwing error
    }
};

// Create a wrapper around the Redis client to handle connection issues gracefully
const redisWrapper = {
    // Original client for direct access if needed
    client: redisClient,
    
    // Wrap common Redis operations with error handling
    connect: async () => safeRedisOperation(redisClient.connect.bind(redisClient)),
    set: async (key, value) => safeRedisOperation(redisClient.set.bind(redisClient), key, value),
    get: async (key) => safeRedisOperation(redisClient.get.bind(redisClient), key),
    del: async (key) => safeRedisOperation(redisClient.del.bind(redisClient), key),
    exists: async (key) => safeRedisOperation(redisClient.exists.bind(redisClient), key),
    expire: async (key, seconds) => safeRedisOperation(redisClient.expire.bind(redisClient), key, seconds),
    expireAt: async (key, timestamp) => safeRedisOperation(redisClient.expireAt.bind(redisClient), key, timestamp),
    zAdd: async (key, members) => safeRedisOperation(redisClient.zAdd.bind(redisClient), key, members),
    zCard: async (key) => safeRedisOperation(redisClient.zCard.bind(redisClient), key),
    zRemRangeByScore: async (key, min, max) => safeRedisOperation(redisClient.zRemRangeByScore.bind(redisClient), key, min, max)
};

module.exports = redisWrapper;