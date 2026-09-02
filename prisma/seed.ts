import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const skills = [
  { name: "HTML", category: "Frontend" },
  { name: "CSS", category: "Frontend" },
  { name: "JavaScript", category: "Frontend" },
  { name: "TypeScript", category: "Frontend" },
  { name: "React", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "Vue.js", category: "Frontend" },
  { name: "Angular", category: "Frontend" },
  { name: "Tailwind CSS", category: "Frontend" },

  { name: "Node.js", category: "Backend" },
  { name: "Express.js", category: "Backend" },
  { name: "NestJS", category: "Backend" },
  { name: "Django", category: "Backend" },
  { name: "Flask", category: "Backend" },
  { name: "FastAPI", category: "Backend" },
  { name: "Spring Boot", category: "Backend" },
  { name: "Laravel", category: "Backend" },

  { name: "Python", category: "Programming" },
  { name: "Java", category: "Programming" },
  { name: "C", category: "Programming" },
  { name: "C++", category: "Programming" },
  { name: "C#", category: "Programming" },
  { name: "Go", category: "Programming" },
  { name: "Rust", category: "Programming" },
  { name: "Kotlin", category: "Programming" },
  { name: "Swift", category: "Programming" },
  { name: "PHP", category: "Programming" },

  { name: "React Native", category: "Mobile" },
  { name: "Flutter", category: "Mobile" },
  { name: "Android", category: "Mobile" },
  { name: "iOS", category: "Mobile" },

  { name: "PostgreSQL", category: "Database" },
  { name: "MySQL", category: "Database" },
  { name: "MongoDB", category: "Database" },
  { name: "Redis", category: "Database" },
  { name: "Supabase", category: "Database" },

  { name: "Git", category: "DevOps" },
  { name: "GitHub", category: "DevOps" },
  { name: "Docker", category: "DevOps" },
  { name: "Kubernetes", category: "DevOps" },

  { name: "AWS", category: "Cloud" },
  { name: "Azure", category: "Cloud" },
  { name: "Google Cloud", category: "Cloud" },

  { name: "TensorFlow", category: "AI/ML" },
  { name: "PyTorch", category: "AI/ML" },
  { name: "Scikit-learn", category: "AI/ML" },
  { name: "Pandas", category: "AI/ML" },
  { name: "NumPy", category: "AI/ML" },
  { name: "OpenAI", category: "AI/ML" },
  { name: "Hugging Face", category: "AI/ML" },

  { name: "Unity", category: "Game Development" },
  { name: "Unreal Engine", category: "Game Development" },
  { name: "Godot", category: "Game Development" },
  { name: "Blender", category: "Game Development" },

  { name: "Figma", category: "Design" },
  { name: "UI/UX Design", category: "Design" },

  { name: "GraphQL", category: "API" },
  { name: "REST API", category: "API" },
  { name: "WebSockets", category: "API" },
];

const developerRoles = [
  {
    name: "Frontend",
    description: "Build user interfaces and frontend applications.",
  },
  {
    name: "Backend",
    description: "Build APIs, services, databases, and server-side systems.",
  },
  {
    name: "Full Stack",
    description: "Work across frontend and backend development.",
  },
  {
    name: "Mobile",
    description: "Build mobile applications for Android, iOS, or both.",
  },
  {
    name: "AI / ML",
    description: "Work on artificial intelligence and machine learning.",
  },
  {
    name: "DevOps",
    description: "Work with infrastructure, deployment, CI/CD, and cloud.",
  },
  {
    name: "Data",
    description: "Work with data engineering, analytics, and data systems.",
  },
  {
    name: "Cybersecurity",
    description: "Work with application, network, and information security.",
  },
  {
    name: "Game Development",
    description: "Build games and interactive experiences.",
  },
  {
    name: "UI / UX",
    description: "Design user interfaces and user experiences.",
  },
  {
    name: "QA / Testing",
    description: "Test applications and maintain software quality.",
  },
  {
    name: "Other",
    description: "Other development or technical specialization.",
  },
];

const lookingForOptions = [
  {
    name: "Projects",
    description: "Looking to join or work on interesting projects.",
  },
  {
    name: "Teammates",
    description: "Looking for developers to build projects together.",
  },
  {
    name: "Open Source",
    description: "Looking to contribute to open-source projects.",
  },
  {
    name: "Collaborators",
    description: "Looking for people to collaborate and build with.",
  },
  {
    name: "Mentorship",
    description: "Looking to learn from or mentor other developers.",
  },
];

/* NEW: Profile interests */
const interests = [
  {
    name: "Web Development",
    category: "Development",
    description: "Building websites and web applications.",
  },
  {
    name: "AI / ML",
    category: "Technology",
    description: "Artificial intelligence and machine learning.",
  },
  {
    name: "Game Development",
    category: "Development",
    description: "Creating games and interactive experiences.",
  },
  {
    name: "Open Source",
    category: "Community",
    description: "Contributing to and building open-source software.",
  },
  {
    name: "Cloud Computing",
    category: "Infrastructure",
    description: "Cloud platforms, infrastructure, and services.",
  },
  {
    name: "Cybersecurity",
    category: "Security",
    description: "Application, network, and information security.",
  },
  {
    name: "Mobile Development",
    category: "Development",
    description: "Building Android and iOS applications.",
  },
  {
    name: "Developer Tools",
    category: "Development",
    description: "Building tools and software for developers.",
  },
  {
    name: "UI / UX",
    category: "Design",
    description: "User interface and user experience design.",
  },
  {
    name: "Blockchain",
    category: "Technology",
    description: "Blockchain and decentralized technologies.",
  },
];

async function main() {
  // Seed skills
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: {
        name: skill.name,
      },
      update: {
        category: skill.category,
      },
      create: skill,
    });
  }

  console.log(`Seeded ${skills.length} skills.`);

  // Seed developer roles
  for (const role of developerRoles) {
    await prisma.developerRole.upsert({
      where: {
        name: role.name,
      },
      update: {
        description: role.description,
      },
      create: role,
    });
  }

  console.log(`Seeded ${developerRoles.length} developer roles.`);

  // Seed looking-for options
  for (const option of lookingForOptions) {
    await prisma.lookingFor.upsert({
      where: {
        name: option.name,
      },
      update: {
        description: option.description,
      },
      create: option,
    });
  }

  console.log(
    `Seeded ${lookingForOptions.length} looking-for options.`
  );

  // Seed interests
  for (const interest of interests) {
    await prisma.interest.upsert({
      where: {
        name: interest.name,
      },
      update: {
        category: interest.category,
        description: interest.description,
      },
      create: interest,
    });
  }

  console.log(`Seeded ${interests.length} interests.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });