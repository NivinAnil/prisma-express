import express from "express";
import swaggerJsDocs from "./routes/utils/swagger";
import helmet from "helmet";
const userRoute = require("./routes/User");
const postRoute = require("./routes/post");
var PORT = process?.env?.PORT || 3000;
const app = express();
app.use(express.json());
app.use(helmet());
app.use("/", userRoute);
app.use("/", postRoute);

const server = app.listen(PORT, () => {
  console.log(server.address());
  swaggerJsDocs(app, PORT);
});
