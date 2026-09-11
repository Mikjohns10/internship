import { PrismaClient, Role, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@agency.com',
      password: hashedPassword,
      name: 'Arjun Mehta',
      role: Role.ADMIN,
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      email: 'priya@agency.com',
      password: hashedPassword,
      name: 'Priya Sharma',
      role: Role.PROJECT_MANAGER,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'rahul@agency.com',
      password: hashedPassword,
      name: 'Rahul Gupta',
      role: Role.PROJECT_MANAGER,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: 'ravi@agency.com',
      password: hashedPassword,
      name: 'Ravi Kumar',
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'sneha@agency.com',
      password: hashedPassword,
      name: 'Sneha Patel',
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'amit@agency.com',
      password: hashedPassword,
      name: 'Amit Singh',
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      email: 'neha@agency.com',
      password: hashedPassword,
      name: 'Neha Reddy',
      role: Role.DEVELOPER,
    },
  });

  console.log('✅ Created 7 users (1 Admin, 2 PMs, 4 Developers)');

  // Create Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Vikram Bhatia',
      email: 'vikram@freshbasket.in',
      company: 'FreshBasket India',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Ananya Iyer',
      email: 'ananya@urbancraft.co',
      company: 'UrbanCraft Studios',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Karthik Nair',
      email: 'karthik@finpulse.io',
      company: 'FinPulse Technologies',
    },
  });

  console.log('✅ Created 3 clients');

  // Past dates for overdue tasks
  const pastDate = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const futureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // Project 1 — FreshBasket E-commerce Platform (PM: Priya)
  const project1 = await prisma.project.create({
    data: {
      name: 'FreshBasket E-commerce Platform',
      description: 'Full e-commerce platform with payment integration, inventory management, and delivery tracking for FreshBasket India.',
      clientId: client1.id,
      createdById: pm1.id,
      status: 'ACTIVE',
    },
  });

  const p1Tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Design product listing page',
        description: 'Create responsive product grid with filtering and sorting capabilities',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: pastDate(10),
        projectId: project1.id,
        assignedToId: dev1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement shopping cart API',
        description: 'Build RESTful cart endpoints with session management and price calculation',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.CRITICAL,
        dueDate: futureDate(2),
        projectId: project1.id,
        assignedToId: dev1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Payment gateway integration',
        description: 'Integrate Razorpay payment gateway with webhook handling for order confirmation',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.CRITICAL,
        dueDate: futureDate(5),
        projectId: project1.id,
        assignedToId: dev2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Order tracking dashboard',
        description: 'Real-time order status tracking page with map integration for delivery progress',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: futureDate(14),
        projectId: project1.id,
        assignedToId: dev2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Inventory sync module',
        description: 'Sync product inventory with warehouse management system via REST API',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: pastDate(3), // OVERDUE
        isOverdue: true,
        projectId: project1.id,
        assignedToId: dev1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Email notification service',
        description: 'Transactional email service for order confirmations, shipping updates, and promotions',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.LOW,
        dueDate: futureDate(7),
        projectId: project1.id,
        assignedToId: dev3.id,
      },
    }),
  ]);

  // Project 2 — UrbanCraft Portfolio Site (PM: Rahul)
  const project2 = await prisma.project.create({
    data: {
      name: 'UrbanCraft Portfolio & Booking',
      description: 'Portfolio showcase website with online booking system for interior design consultations.',
      clientId: client2.id,
      createdById: pm2.id,
      status: 'ACTIVE',
    },
  });

  const p2Tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Portfolio gallery component',
        description: 'Masonry grid gallery with lightbox, lazy loading, and category filters',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: pastDate(7),
        projectId: project2.id,
        assignedToId: dev3.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Booking calendar integration',
        description: 'Interactive calendar with available time slots, timezone handling, and Google Calendar sync',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.CRITICAL,
        dueDate: futureDate(3),
        projectId: project2.id,
        assignedToId: dev3.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Client testimonials section',
        description: 'Animated carousel with client reviews, ratings, and project photos',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.MEDIUM,
        dueDate: futureDate(1),
        projectId: project2.id,
        assignedToId: dev4.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Contact form with CRM sync',
        description: 'Contact form that syncs leads to the client HubSpot CRM automatically',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: pastDate(1), // OVERDUE
        isOverdue: true,
        projectId: project2.id,
        assignedToId: dev4.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'SEO optimization',
        description: 'Meta tags, structured data, sitemap generation, and Core Web Vitals optimization',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: futureDate(21),
        projectId: project2.id,
        assignedToId: dev4.id,
      },
    }),
  ]);

  // Project 3 — FinPulse Analytics Dashboard (PM: Priya)
  const project3 = await prisma.project.create({
    data: {
      name: 'FinPulse Analytics Dashboard',
      description: 'Real-time financial analytics dashboard with interactive charts, alerts, and report generation.',
      clientId: client3.id,
      createdById: pm1.id,
      status: 'ACTIVE',
    },
  });

  const p3Tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Chart library integration',
        description: 'Set up D3.js with React wrapper for interactive financial charts (line, bar, candlestick)',
        status: TaskStatus.DONE,
        priority: TaskPriority.CRITICAL,
        dueDate: pastDate(14),
        projectId: project3.id,
        assignedToId: dev2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Real-time data pipeline',
        description: 'WebSocket-based data streaming from financial APIs with throttled UI updates',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.CRITICAL,
        dueDate: futureDate(4),
        projectId: project3.id,
        assignedToId: dev2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Alert configuration panel',
        description: 'UI for setting up price alerts, threshold notifications, and custom triggers',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: futureDate(10),
        projectId: project3.id,
        assignedToId: dev1.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'PDF report generator',
        description: 'Generate downloadable PDF reports with charts, tables, and custom date ranges',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: futureDate(18),
        projectId: project3.id,
        assignedToId: dev3.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'User roles & permissions',
        description: 'Role-based access control for dashboard views — viewer, analyst, admin tiers',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.HIGH,
        dueDate: futureDate(1),
        projectId: project3.id,
        assignedToId: dev4.id,
      },
    }),
  ]);

  console.log('✅ Created 3 projects with 16 tasks (2 overdue)');

  // Create Activity Log entries so the feed isn't empty
  const allTasks = [...p1Tasks, ...p2Tasks, ...p3Tasks];
  const activityEntries = [
    {
      action: 'TASK_CREATED',
      details: `Priya Sharma created task "Design product listing page"`,
      userId: pm1.id,
      projectId: project1.id,
      taskId: p1Tasks[0].id,
    },
    {
      action: 'STATUS_CHANGE',
      details: `Ravi Kumar moved "Design product listing page" from To Do → In Progress`,
      userId: dev1.id,
      projectId: project1.id,
      taskId: p1Tasks[0].id,
      oldValue: 'TODO',
      newValue: 'IN_PROGRESS',
    },
    {
      action: 'STATUS_CHANGE',
      details: `Ravi Kumar moved "Design product listing page" from In Progress → Done`,
      userId: dev1.id,
      projectId: project1.id,
      taskId: p1Tasks[0].id,
      oldValue: 'IN_PROGRESS',
      newValue: 'DONE',
    },
    {
      action: 'TASK_CREATED',
      details: `Priya Sharma created task "Implement shopping cart API"`,
      userId: pm1.id,
      projectId: project1.id,
      taskId: p1Tasks[1].id,
    },
    {
      action: 'STATUS_CHANGE',
      details: `Ravi Kumar moved "Implement shopping cart API" from To Do → In Progress`,
      userId: dev1.id,
      projectId: project1.id,
      taskId: p1Tasks[1].id,
      oldValue: 'TODO',
      newValue: 'IN_PROGRESS',
    },
    {
      action: 'STATUS_CHANGE',
      details: `Ravi Kumar moved "Implement shopping cart API" from In Progress → In Review`,
      userId: dev1.id,
      projectId: project1.id,
      taskId: p1Tasks[1].id,
      oldValue: 'IN_PROGRESS',
      newValue: 'IN_REVIEW',
    },
    {
      action: 'TASK_ASSIGNED',
      details: `Priya Sharma assigned "Payment gateway integration" to Sneha Patel`,
      userId: pm1.id,
      projectId: project1.id,
      taskId: p1Tasks[2].id,
    },
    {
      action: 'STATUS_CHANGE',
      details: `Sneha Patel moved "Payment gateway integration" from To Do → In Progress`,
      userId: dev2.id,
      projectId: project1.id,
      taskId: p1Tasks[2].id,
      oldValue: 'TODO',
      newValue: 'IN_PROGRESS',
    },
    {
      action: 'TASK_OVERDUE',
      details: `"Inventory sync module" is now overdue`,
      userId: pm1.id,
      projectId: project1.id,
      taskId: p1Tasks[4].id,
    },
    {
      action: 'TASK_CREATED',
      details: `Rahul Gupta created task "Portfolio gallery component"`,
      userId: pm2.id,
      projectId: project2.id,
      taskId: p2Tasks[0].id,
    },
    {
      action: 'STATUS_CHANGE',
      details: `Amit Singh moved "Portfolio gallery component" from In Progress → Done`,
      userId: dev3.id,
      projectId: project2.id,
      taskId: p2Tasks[0].id,
      oldValue: 'IN_PROGRESS',
      newValue: 'DONE',
    },
    {
      action: 'STATUS_CHANGE',
      details: `Neha Reddy moved "Client testimonials section" from In Progress → In Review`,
      userId: dev4.id,
      projectId: project2.id,
      taskId: p2Tasks[2].id,
      oldValue: 'IN_PROGRESS',
      newValue: 'IN_REVIEW',
    },
    {
      action: 'TASK_OVERDUE',
      details: `"Contact form with CRM sync" is now overdue`,
      userId: pm2.id,
      projectId: project2.id,
      taskId: p2Tasks[3].id,
    },
    {
      action: 'TASK_CREATED',
      details: `Priya Sharma created task "Chart library integration"`,
      userId: pm1.id,
      projectId: project3.id,
      taskId: p3Tasks[0].id,
    },
    {
      action: 'STATUS_CHANGE',
      details: `Sneha Patel moved "Chart library integration" from In Progress → Done`,
      userId: dev2.id,
      projectId: project3.id,
      taskId: p3Tasks[0].id,
      oldValue: 'IN_PROGRESS',
      newValue: 'DONE',
    },
    {
      action: 'STATUS_CHANGE',
      details: `Neha Reddy moved "User roles & permissions" from In Progress → In Review`,
      userId: dev4.id,
      projectId: project3.id,
      taskId: p3Tasks[4].id,
      oldValue: 'IN_PROGRESS',
      newValue: 'IN_REVIEW',
    },
  ];

  // Stagger timestamps so the feed looks natural
  for (let i = 0; i < activityEntries.length; i++) {
    const entry = activityEntries[i];
    await prisma.activityLog.create({
      data: {
        ...entry,
        createdAt: new Date(Date.now() - (activityEntries.length - i) * 3600000), // 1 hour apart
      },
    });
  }

  console.log(`✅ Created ${activityEntries.length} activity log entries`);

  // Create some notifications
  const notifications = [
    {
      type: 'TASK_ASSIGNED' as const,
      message: 'You\'ve been assigned to "Implement shopping cart API" in FreshBasket E-commerce Platform',
      userId: dev1.id,
      taskId: p1Tasks[1].id,
      projectId: project1.id,
    },
    {
      type: 'TASK_STATUS_CHANGED' as const,
      message: '"Implement shopping cart API" has been moved to In Review by Ravi Kumar',
      userId: pm1.id,
      taskId: p1Tasks[1].id,
      projectId: project1.id,
    },
    {
      type: 'TASK_OVERDUE' as const,
      message: '"Inventory sync module" in FreshBasket E-commerce Platform is now overdue',
      userId: dev1.id,
      taskId: p1Tasks[4].id,
      projectId: project1.id,
    },
    {
      type: 'TASK_OVERDUE' as const,
      message: '"Inventory sync module" in FreshBasket E-commerce Platform is now overdue',
      userId: pm1.id,
      taskId: p1Tasks[4].id,
      projectId: project1.id,
    },
    {
      type: 'TASK_ASSIGNED' as const,
      message: 'You\'ve been assigned to "Booking calendar integration" in UrbanCraft Portfolio & Booking',
      userId: dev3.id,
      taskId: p2Tasks[1].id,
      projectId: project2.id,
    },
    {
      type: 'TASK_STATUS_CHANGED' as const,
      message: '"Client testimonials section" has been moved to In Review by Neha Reddy',
      userId: pm2.id,
      taskId: p2Tasks[2].id,
      projectId: project2.id,
    },
    {
      type: 'TASK_OVERDUE' as const,
      message: '"Contact form with CRM sync" in UrbanCraft Portfolio & Booking is now overdue',
      userId: dev4.id,
      taskId: p2Tasks[3].id,
      projectId: project2.id,
    },
    {
      type: 'TASK_STATUS_CHANGED' as const,
      message: '"User roles & permissions" has been moved to In Review by Neha Reddy',
      userId: pm1.id,
      taskId: p3Tasks[4].id,
      projectId: project3.id,
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({ data: notif });
  }

  console.log(`✅ Created ${notifications.length} notifications`);

  console.log('\n🎉 Seed complete!\n');
  console.log('Login credentials (all passwords: password123):');
  console.log('  Admin:    admin@agency.com');
  console.log('  PM 1:     priya@agency.com');
  console.log('  PM 2:     rahul@agency.com');
  console.log('  Dev 1:    ravi@agency.com');
  console.log('  Dev 2:    sneha@agency.com');
  console.log('  Dev 3:    amit@agency.com');
  console.log('  Dev 4:    neha@agency.com');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
