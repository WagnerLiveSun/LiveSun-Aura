import { hash } from "argon2";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import readline from "readline";

// Configuração do banco de dados
const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:livesun@localhost:3306/sunset";

async function createAdmin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  try {
    console.log("🔐 Criação de Administrador - LiveSun Sunset\n");

    const name = await question("Nome do administrador: ");
    const email = await question("E-mail do administrador: ");
    const password = await question("Senha (mínimo 8 caracteres): ");

    if (password.length < 8) {
      console.error("❌ A senha deve ter no mínimo 8 caracteres");
      process.exit(1);
    }

    // Conectar ao banco de dados
    console.log("\n📊 Conectando ao banco de dados...");
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    // Verificar se e-mail já existe
    console.log("🔍 Verificando se e-mail já existe...");
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing.length > 0) {
      console.error("❌ Este e-mail já está cadastrado");
      rl.close();
      await connection.end();
      process.exit(1);
    }

    // Gerar openId e hash da senha
    console.log("🔐 Gerando hash da senha...");
    const openId = randomUUID();
    const passwordHash = await hash(password);

    // Criar usuário
    console.log("👤 Criando administrador...");
    const [result] = await db.insert(users).values({
      openId,
      name,
      email,
      passwordHash,
      role: "admin",
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
    console.log(`   Perfil: admin`);
    console.log(`   OpenID: ${openId}`);
    console.log(`\n⚠️  Guarde estas informações em local seguro!`);

    rl.close();
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar administrador:", error);
    rl.close();
    process.exit(1);
  }
}

createAdmin();