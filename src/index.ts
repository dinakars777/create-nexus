#!/usr/bin/env node
import { intro, outro, spinner, text, confirm, select, isCancel } from '@clack/prompts';
import { Command } from 'commander';
import pc from 'picocolors';
import { generateBoilerplate } from './generator';
import { execa } from 'execa';

const program = new Command();

program
  .name('create-nexus')
  .description('Scaffold the ultimate Agent-Native Boilerplate.')
  .version('2.0.0');

program.action(async () => {
  console.log();
  intro(pc.inverse(pc.bold(' 🧠 CREATE NEXUS: Agent-Native Stack ')));

  const projectName = await text({
    message: 'What is your project named?',
    placeholder: 'my-agent-app',
    validate(value) {
      if (!value || value.length === 0) return 'Project name is required!';
      if (/^[a-zA-Z0-9-]+$/.test(value) === false) return 'Project name can only contain letters, numbers, and dashes.';
    },
  });

  if (isCancel(projectName)) {
    outro('Operation cancelled.');
    process.exit(0);
  }

  const template = await select({
    message: 'Which template would you like to use?',
    options: [
      { value: 'full-stack', label: 'Full-Stack (Next.js + Hono + Drizzle)', hint: 'Complete agent-native stack' },
      { value: 'api-only', label: 'API Only (Hono + Drizzle)', hint: 'Backend-focused, no Next.js' },
      { value: 'minimal', label: 'Minimal (.agent/ control plane only)', hint: 'Just the agent architecture' },
    ],
  });

  if (isCancel(template)) {
    outro('Operation cancelled.');
    process.exit(0);
  }

  let database = 'postgresql';
  if (template !== 'minimal') {
    database = await select({
      message: 'Which database would you like to use?',
      options: [
        { value: 'postgresql', label: 'PostgreSQL', hint: 'Production-ready' },
        { value: 'sqlite', label: 'SQLite', hint: 'Local development' },
        { value: 'mysql', label: 'MySQL', hint: 'Alternative production DB' },
      ],
    }) as string;

    if (isCancel(database)) {
      outro('Operation cancelled.');
      process.exit(0);
    }
  }

  let auth = 'none';
  if (template === 'full-stack') {
    auth = await select({
      message: 'Include authentication?',
      options: [
        { value: 'none', label: 'None', hint: 'Skip auth for now' },
        { value: 'clerk', label: 'Clerk', hint: 'Modern auth with UI components' },
        { value: 'nextauth', label: 'NextAuth.js', hint: 'Flexible auth solution' },
      ],
    }) as string;

    if (isCancel(auth)) {
      outro('Operation cancelled.');
      process.exit(0);
    }
  }

  const s = spinner();
  s.start(`Scaffolding Agent-Native architecture into ${projectName}...`);

  try {
    await generateBoilerplate(projectName as string, {
      template: template as string,
      database: database as string,
      auth: auth as string,
    });
    s.stop(pc.green('✓ Scaffold instantiated successfully.'));
  } catch (err: any) {
    s.stop(pc.red('✖ Failed to generate project.'));
    console.error(pc.red(err.message));
    process.exit(1);
  }

  console.log();
  console.log(pc.bold('Included in your stack:'));
  
  if (template === 'full-stack') {
    console.log(pc.cyan('  • Next.js App Router') + ' (Frontend)');
    console.log(pc.cyan('  • Hono RPC') + ' (Type-safe API Backend)');
  } else if (template === 'api-only') {
    console.log(pc.cyan('  • Hono API') + ' (Type-safe Backend)');
  }
  
  if (template !== 'minimal') {
    console.log(pc.cyan(`  • Drizzle ORM + ${database.charAt(0).toUpperCase() + database.slice(1)}`) + ' (Strict Zod Schemas)');
  }
  
  if (auth !== 'none') {
    console.log(pc.cyan(`  • ${auth === 'clerk' ? 'Clerk' : 'NextAuth.js'}`) + ' (Authentication)');
  }
  
  console.log(pc.cyan('  • The Twin-File Architecture') + ' (CONCEPTS.md context layer)');
  console.log(pc.cyan('  • .agent/ Control Plane') + ' (Rules, project map, scratchpad)');
  console.log(pc.cyan('  • .cursorrules') + ' (AI IDE integration)');
  
  if (template !== 'minimal') {
    console.log(pc.cyan('  • Integrated MCP Stub') + ' (server/mcp for Agent querying)');
    console.log(pc.cyan('  • Husky + tsc') + ' (Strict commit verification hooks)');
  }
  console.log();

  const installDeps = await confirm({
    message: 'Would you like to install dependencies now? (npm install)',
    initialValue: true,
  });

  if (isCancel(installDeps)) {
    outro('Operation cancelled.');
    process.exit(0);
  }

  if (installDeps) {
    s.start('Installing dependencies via npm...');
    try {
      await execa('npm', ['install'], { cwd: projectName as string });
      s.stop(pc.green('✓ Dependencies installed.'));
    } catch {
      s.stop(pc.red('✖ Failed to install dependencies. You can run npm install manually later.'));
    }
  }

  const initGit = await confirm({
    message: 'Initialize a new Git repository?',
    initialValue: true,
  });

  if (!isCancel(initGit) && initGit) {
      try {
          await execa('git', ['init'], { cwd: projectName as string });
          console.log(pc.green('✓ Git repository initialized.'));
      } catch {}
  }

  console.log();
  console.log(pc.bgGreen(' SUCCESS! ') + ` Project ${projectName} is ready for an AI Agent to dominate.`);
  console.log('Next steps:');
  console.log(pc.bold(`  cd ${projectName}`));
  if (template !== 'minimal') {
    console.log(pc.bold('  cp .env.example .env'));
    console.log(pc.bold('  # Edit .env with your database credentials'));
    console.log(pc.bold('  npm run db:push'));
  }
  console.log(pc.bold('  npm run dev'));
  
  outro('Good luck building!');
});

program.parse(process.argv);
