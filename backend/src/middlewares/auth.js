import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Please sign in to continue." });
  }
};
export const requireRole = (roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res
        .status(403)
        .json({ message: "This action is not available for your role." });
export const requireAdmin = requireRole(["admin"]);