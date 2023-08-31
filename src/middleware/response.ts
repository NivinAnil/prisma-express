// this is a middleware that will be used to send the response to the client
// structure of the response:
// {
//   data: any,
//   error: string,
//   message: string,
//   status: number
// }
// return error if error is not empty
import { Response } from "express";
export const response = (
  res: Response,
  data: any,
  error: any,
  message: string,
  status: number
) => {
  if (error) {
    res.status(status).json({
      data: null,
      error,
      message,
      status,
    });
  } else {
    res.status(status).json({
      data,
      error: null,
      message,
      status,
    });
  }
};
