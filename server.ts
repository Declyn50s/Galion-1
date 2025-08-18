import 'dotenv/config';
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

type Row = { sehl: number; adresse: string; baseLegale: string };

app.get("/api/immeubles", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const pageSize = Math.min(5000, Math.max(1, parseInt(String(req.query.pageSize ?? "1000"), 10)));
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [total, data] = await Promise.all([
      prisma.immeuble.count(),
      prisma.immeuble.findMany({
        orderBy: { sehl: "asc" },
        skip,
        take,
        select: { sehl: true, adresse: true, baseLegale: true },
      }),
    ]);

    res.json({ page, pageSize, total, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(PORT, () => {
  console.log(`API dispo sur http://localhost:${PORT}`);
});
