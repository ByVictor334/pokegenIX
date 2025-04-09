import { Request, Response } from "express";

const loginWithGoogle = async (req: Request, res: Response) => {
  const { token } = req.body;
};

export { loginWithGoogle };
