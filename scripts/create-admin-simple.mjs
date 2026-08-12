import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import "dotenv/config";

// Usar IP e username completo que funcionaram nas migrations
const DATABASE_URL = "mysql://u951548013_livesun_aura:quemsabe123!A@195.35.61.111:3306/u951548013_livesun_aura";

async function createAdmin() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const name = "Administrator";
  const email = "admin@livesun.com.br";
  const password = "admin123"; // Senha padrão - alterar após primeiro acesso
  const role = "admin";

  console.log("🔐 Criando administrador padrão...");
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Senha: ${password}`);
  console.log(`⚠️  Altere a senha após primeiro acesso!`);

  // Verificar se e-mail já existe
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    console.log("❌ Este e-mail já está cadastrado");
    await connection.end();
    process.exit(1);
  }

  // Gerar openId e hash da senha
  const openId = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  // Criar usuário
  const [result] = await db.insert(users).values({
    openId,
    name,
    email,
    passwordHash,
    role,
    ativo: true,
    loginMethod: "local",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });

  console.log("✅ Administrador criado com sucesso!");
  console.log(`\n📋 Detalhes:`);
  console.log(`   ID: ${result.insertId}`);
  console.log(`   Nome: ${name}`);
  console.log(`   E-mail: ${email}`);
  console.log(`   Senha: ${password}`);
  console.log(`   Perfil: ${role}`);
  console.log(`   OpenID: ${openId}`);
  console.log(`\n⚠️  ALTERE A SENHA APÓS PRIMEIRO ACESSO!`);

  await connection.end();
  process.exit(0);
}

createAdmin().catch((error) => {
  console.error("❌ Erro ao criar administrador:", error);
  process.exit(1);
});