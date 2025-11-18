
import { auth } from "./index";

type Session = typeof auth.$Infer.Session;

const s: Session = {} as any;
s.user.role;
