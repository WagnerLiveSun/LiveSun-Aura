import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import "dotenv/config";

const DATABASE_URL = "mysql://u951548013_livesun_aura:quemsabe123!A@195.35.61.111:3306/u951548013_livesun_aura";

async function updateAdminPassword() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const email = "admin@livesun.com.br";
  const password = "admin123";

  console.log("🔐 Atualizando senha do administrador...");

  // Buscar usuário
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    console.log("❌ Usuário não encontrado");
    await connection.end();
    process.exit(1);
  }

  // Atualizar hash da senha
  const passwordHash = await bcrypt.hash(password, 10);

  await db.update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  console.log("✅ Senha atualizada com sucesso!");
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Senha: ${password}`);
  console.log(`⚠️  ALTERE A SENHA APÓS PRIMEIRO ACESSO!`);

  await connection.end();
  process.exit(0);
}

updateAdminPassword().catch((error) => {
  console.error("❌ Erro ao atualizar senha:", error);
  process.exit(1);
});