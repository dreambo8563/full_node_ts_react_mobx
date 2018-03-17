const config = {
  app: {
    env: "development",
    port: 8192
  },
  winston: {
    consoleLevel: "debug",
    fileLevel: "info",
    filename: "logs/tools-node-server-dev.log"
  },
  db: {
    client: "mysql",
    connection: {
      host: "dev.snaplingo.com",
      user: "root",
      port: "8980",
      password: "jjjjjj",
      database: "data"
    },
    pool: { min: 0, max: 10 }
  },
  session: {
    name: "crm.sessionId",
    secret: "TP78x5qh3uwPhm5xpEuUlojX",
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
    host: "redis_Dev",
    port: 6379
  },
  redis: {
    port: 8989,
    host: "dev.snaplingo.com"
  },
  serverName: {
    wxtools: "http://wxtools.dev.snaplingo.com",
    wxtools_node: "http://qa-wxtools-node.snaplingo.com"
  }
}

export { config }
