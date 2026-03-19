import { httpServer } from "./app"
import { env } from "./config/env"

httpServer.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`)
})