import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

type JobType = 'INTERN' | 'CAMPUS' | 'SOCIAL';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const companies = [
  { name: '字节跳动', size: '10000人以上', industry: '互联网/科技' },
  { name: '腾讯', size: '10000人以上', industry: '互联网/科技' },
  { name: '阿里巴巴', size: '10000人以上', industry: '电商/科技' },
  { name: '美团', size: '10000人以上', industry: '本地生活/科技' },
  { name: '京东', size: '10000人以上', industry: '电商/科技' },
  { name: '百度', size: '10000人以上', industry: 'AI/科技' },
  { name: '网易', size: '10000人以上', industry: '游戏/互联网' },
  { name: '快手', size: '10000人以上', industry: '短视频/社交' },
  { name: '小红书', size: '5000-10000人', industry: '社交/电商' },
  { name: '拼多多', size: '10000人以上', industry: '电商' },
  { name: '华为', size: '10000人以上', industry: '通信/科技' },
  { name: '蚂蚁集团', size: '10000人以上', industry: '金融科技' },
  { name: 'bilibili', size: '5000-10000人', industry: '视频/娱乐' },
  { name: '滴滴', size: '10000人以上', industry: '出行/科技' },
  { name: '大疆', size: '5000-10000人', industry: '无人机/智能硬件' },
  { name: '商汤科技', size: '1000-5000人', industry: 'AI' },
  { name: '旷视科技', size: '1000-5000人', industry: 'AI' },
  { name: '地平线', size: '1000-5000人', industry: 'AI/自动驾驶' },
  { name: '理想汽车', size: '5000-10000人', industry: '新能源汽车' },
  { name: '小米', size: '10000人以上', industry: '消费电子/互联网' },
];

const positions = [
  {
    name: '前端开发工程师',
    department: '基础技术部',
    jd: '负责公司核心产品的前端架构设计与开发，参与技术方案设计和代码评审，持续优化前端性能和用户体验。',
    requirements: [
      '本科及以上学历，计算机相关专业',
      '熟悉 React/Vue 等主流前端框架',
      '熟悉 TypeScript，有大型项目开发经验',
      '了解前端工程化，熟悉 Webpack/Vite 等构建工具',
      '有良好的编码习惯和团队协作能力',
    ],
    preferred: ['有开源项目贡献经验', '了解 Node.js 后端开发', '有性能优化经验'],
    salary: '25k-45k·16薪',
  },
  {
    name: '后端开发工程师',
    department: '服务端架构组',
    jd: '负责服务端系统的设计与开发，参与微服务架构的建设，保障系统高可用和高性能。',
    requirements: [
      '本科及以上学历，计算机相关专业',
      '熟悉 Java/Go/Python 至少一门后端语言',
      '熟悉 MySQL、Redis 等常用存储组件',
      '了解分布式系统设计原理',
      '有良好的系统设计能力和问题排查能力',
    ],
    preferred: ['有高并发系统开发经验', '熟悉 Kubernetes/Docker', '了解消息队列 Kafka/RabbitMQ'],
    salary: '25k-50k·16薪',
  },
  {
    name: '算法工程师',
    department: 'AI Lab',
    jd: '负责推荐/搜索/NLP/CV 等方向的算法研发，设计并实现核心算法模型，通过数据驱动持续优化业务指标。',
    requirements: [
      '硕士及以上学历，计算机/数学/统计相关专业',
      '扎实的机器学习/深度学习基础',
      '熟悉 PyTorch/TensorFlow 等深度学习框架',
      '有相关方向的研究或项目经验',
      '良好的论文阅读和复现能力',
    ],
    preferred: ['有顶会论文发表经验', '有大规模数据处理经验', '了解 LLM/大模型相关技术'],
    salary: '30k-60k·16薪',
  },
  {
    name: '数据分析师',
    department: '数据智能部',
    jd: '负责业务数据分析和洞察，搭建数据指标体系，通过数据驱动业务决策和产品优化。',
    requirements: [
      '本科及以上学历，统计/数学/计算机相关专业',
      '熟练使用 SQL 进行数据查询和分析',
      '熟悉 Python/R 数据分析工具',
      '具备良好的数据敏感度和业务理解能力',
      '有较强的逻辑思维和沟通表达能力',
    ],
    preferred: ['有 A/B 测试和因果推断经验', '熟悉 Tableau/PowerBI 等可视化工具', '有用户增长分析经验'],
    salary: '20k-40k·15薪',
  },
  {
    name: '产品经理',
    department: '产品部',
    jd: '负责产品规划和设计，推动产品从0到1的落地，深入理解用户需求，持续优化产品体验。',
    requirements: [
      '本科及以上学历',
      '有互联网产品设计经验，熟悉产品设计方法论',
      '具备优秀的逻辑思维和数据分析能力',
      '有良好的跨部门沟通和项目推动能力',
      '对用户体验有深刻理解和追求',
    ],
    preferred: ['有 C 端产品经验', '有从0到1的产品经历', '了解技术实现原理'],
    salary: '20k-40k·16薪',
  },
];

const cities = ['北京', '上海', '深圳', '杭州', '广州', '成都'];
const jobTypes: JobType[] = ['INTERN', 'CAMPUS', 'SOCIAL'];

async function main() {
  console.log('Seeding jobs...');

  const jobs = [];
  let idx = 0;

  for (const company of companies) {
    const numPositions = 2 + (idx % 2);
    for (let i = 0; i < numPositions && i < positions.length; i++) {
      const pos = positions[(idx + i) % positions.length];
      const city = cities[idx % cities.length];
      const jobType = jobTypes[idx % jobTypes.length];

      jobs.push({
        company: company.name,
        positionName: pos.name,
        department: pos.department,
        jobType,
        location: [city, cities[(idx + 1) % cities.length]],
        jdContent: pos.jd,
        requirements: pos.requirements,
        preferred: pos.preferred,
        salaryRange: jobType === 'INTERN' ? '200-400元/天' : pos.salary,
        postDate: new Date(2026, 3, 1 + (idx % 28)),
        deadline: new Date(2026, 5, 1 + (idx % 28)),
        sourceUrl: `https://careers.example.com/${company.name}/${idx}`,
        companySize: company.size,
        industry: company.industry,
      });
      idx++;
    }
  }

  for (const job of jobs) {
    await prisma.job.create({ data: job });
  }

  console.log(`Seeded ${jobs.length} jobs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
