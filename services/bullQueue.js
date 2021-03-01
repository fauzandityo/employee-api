module.exports = [
  {
    name: 'generate-absence',
    hostId: 'employee',
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  },
  {
    name: 'generate-leave',
    hostId: 'employee',
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  },
  {
    name: 'generate-salary',
    hostId: 'employee',
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  },
]