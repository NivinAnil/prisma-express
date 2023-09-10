import express from "express";
import swaggerJsDocs from "./routes/utils/swagger";
const userRoute = require("./routes/User");
const postRoute = require("./routes/post");

const app = express();
app.use(express.json());
app.use("/", userRoute);
app.use("/", postRoute);

const server = app.listen(4000, () => {
  console.log(server.address());
  swaggerJsDocs(app, 4000);
});
