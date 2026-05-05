import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'feedback' },
      update: {},
      create: { name: '互动反馈', slug: 'feedback', description: '在线提交反馈与投诉', sort: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'suggestions' },
      update: {},
      create: { name: '建议征集', slug: 'suggestions', description: '征集意见与改进建议', sort: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'notice' },
      update: {},
      create: { name: '公告通知', slug: 'notice', description: '重要通知公告', sort: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'news' },
      update: {},
      create: { name: '新闻动态', slug: 'news', description: '最新新闻动态', sort: 4 },
    }),
  ])

  // Create admin user
  const adminPassword = bcrypt.hashSync('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      realName: '系统管理员',
      role: 'SUPER_ADMIN',
      permissions: JSON.stringify(['publish', 'posts', 'comments', 'users', 'menus', 'settings']),
      email: 'admin@example.com',
    },
  })

  // Create sample posts
  const samplePosts = [
    // 互动反馈
    { title: '关于开通在线反馈渠道的通知', content: '<p>为更好地服务广大用户，现开通在线反馈渠道，欢迎大家提交意见和建议。</p>', summary: '在线反馈渠道正式开通', categoryId: categories[0].id, isTop: true },
    { title: '关于加强用户反馈处理的通知', content: '<p>为提升反馈处理效率，现将有关事项通知如下：</p><p>一、各部门高度重视用户反馈</p><p>二、建立反馈处理机制</p><p>三、加强问题排查与化解</p>', summary: '加强用户反馈处理机制建设', categoryId: categories[0].id, isTop: true },
    { title: '反馈事项办理流程说明', content: '<p>为方便用户了解反馈办理流程，现公布如下：</p><p>1. 提交反馈</p><p>2. 受理登记</p><p>3. 转办处理</p><p>4. 结果反馈</p><p>5. 满意度评价</p>', summary: '反馈事项办理的完整流程', categoryId: categories[0].id, isTop: false },
    { title: '关于规范反馈提交格式的说明', content: '<p>为提高反馈处理效率，请在提交时注明类别、描述和联系方式。</p>', summary: '反馈提交格式规范', categoryId: categories[0].id, isTop: false },
    { title: '第一季度反馈处理情况通报', content: '<p>第一季度共收到反馈128件，已处理120件，处理率93.7%。</p>', summary: '第一季度反馈处理情况汇总', categoryId: categories[0].id, isTop: false },
    { title: '常见问题解答（FAQ）', content: '<p>整理了用户高频反馈的问题及解答，供参考。</p>', summary: '常见问题解答汇总', categoryId: categories[0].id, isTop: false },
    // 建议征集
    { title: '2024年度意见征集活动启动', content: '<p>为广泛听取意见建议，提升服务质量，现开展2024年度征集活动。</p><p>征集时间：2024年1月-12月</p><p>征集方式：线上提交</p><p>欢迎积极参与！</p>', summary: '广泛征集意见建议，提升服务质量', categoryId: categories[1].id, isTop: true },
    { title: '征集服务改进建议', content: '<p>为进一步提升服务水平，现面向社会征集服务改进建议。</p><p>征集内容：服务态度、效率、环境、创新等。</p>', summary: '面向社会征集服务改进建议', categoryId: categories[1].id, isTop: false },
    { title: '关于“效能提升”意见建议征集', content: '<p>为提升整体工作效能，现征集意见和建议。</p>', summary: '效能提升建议征集', categoryId: categories[1].id, isTop: false },
    { title: '关于“制度优化”意见建议征集', content: '<p>为完善各项管理制度，现征集相关建议。</p>', summary: '制度优化建议征集', categoryId: categories[1].id, isTop: false },
    // 公告通知
    { title: '2024年春节放假通知', content: '<p>根据国务院办公厅关于2024年春节放假的安排，现将春节期间工作安排通知如下：</p><p>2024年2月10日至17日放假，2月18日正常上班。</p><p>线上服务正常运行。</p>', summary: '2024年春节期间工作时间安排', categoryId: categories[2].id, isTop: false },
    { title: '违规问题典型案例通报', content: '<p>近日，对存在的违规问题进行了通报，要求各部门引以为戒。</p>', summary: '违规问题典型案例通报', categoryId: categories[2].id, isTop: false },
    { title: '关于开展2024年度员工培训的通知', content: '<p>为提升员工业务能力，现开展2024年度培训工作。</p>', summary: '2024年度员工培训通知', categoryId: categories[2].id, isTop: false },
    { title: '关于系统升级维护的公告', content: '<p>因系统升级维护，部分业务将暂停服务，请提前做好安排。</p>', summary: '系统升级维护公告', categoryId: categories[2].id, isTop: false },
    // 新闻动态
    { title: '数字化转型取得新突破', content: '<p>近日，在数字化转型方面取得重要进展，移动端用户突破500万，线上交易占比超过85%。</p><p>下一步将继续加大科技投入，为用户提供更便捷的服务。</p>', summary: '数字化转型成果显著', categoryId: categories[3].id, isTop: false },
    { title: '2024年度工作推进倡议书', content: '<p>为推动年度各项重点工作，特发起工作推进倡议。</p>', summary: '年度工作推进倡议书发布', categoryId: categories[3].id, isTop: false },
    { title: '寻根宪法之魂 共筑法治企业', content: '<p>为弘扬宪法精神，推进法治企业建设，开展了系列法治宣传活动。</p>', summary: '法治企业建设宣传活动', categoryId: categories[3].id, isTop: false },
    { title: '与高校党建共建签约仪式', content: '<p>近日，与高校举办了党建共建签约仪式。</p>', summary: '校企合作签约仪式', categoryId: categories[3].id, isTop: false },
    { title: '学史力行践初心 基层开展七一活动', content: '<p>6月30日，基层开展七一主题活动，传承红色基因。</p>', summary: '七一主题活动报道', categoryId: categories[3].id, isTop: false },
    { title: '领导一行赴基层调研', content: '<p>领导一行赴基层开展调研工作，了解业务开展情况。</p>', summary: '领导调研基层工作', categoryId: categories[3].id, isTop: false },
  ]

  for (const post of samplePosts) {
    await prisma.post.create({
      data: {
        ...post,
        authorId: admin.id,
      },
    })
  }

  // Create default nav menus (functional pages only, admin can add more)
  await Promise.all([
    prisma.navMenu.create({ data: { name: '首页', url: '/', sort: 1 } }),
    prisma.navMenu.create({ data: { name: '互动反馈', url: '/category/feedback', sort: 2 } }),
    prisma.navMenu.create({ data: { name: '建议征集', url: '/category/suggestions', sort: 3 } }),
    prisma.navMenu.create({ data: { name: '公告通知', url: '/category/notice', sort: 4 } }),
    prisma.navMenu.create({ data: { name: '新闻动态', url: '/category/news', sort: 5 } }),
    prisma.navMenu.create({ data: { name: '信息查询', url: '/search', sort: 6 } }),
  ])

  // Create default site settings
  await prisma.siteSetting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: { key: 'site_name', value: '企业门户网站', label: '站点名称' },
  })
  await prisma.siteSetting.upsert({
    where: { key: 'site_short_name' },
    update: {},
    create: { key: 'site_short_name', value: '企业门户', label: '站点简称' },
  })
  await prisma.siteSetting.upsert({
    where: { key: 'site_logo_text' },
    update: {},
    create: { key: 'site_logo_text', value: 'EP', label: 'Logo文字' },
  })
  await prisma.siteSetting.upsert({
    where: { key: 'site_logo_subtitle' },
    update: {},
    create: { key: 'site_logo_subtitle', value: 'ENTERPRISE PORTAL', label: 'Logo副标题' },
  })
  await prisma.siteSetting.upsert({
    where: { key: 'home_modules' },
    update: {},
    create: { key: 'home_modules', value: '', label: '首页模块配置（JSON）' },
  })
  await prisma.siteSetting.upsert({
    where: { key: 'popup_image' },
    update: {},
    create: { key: 'popup_image', value: '', label: '悬浮按钮弹窗图片' },
  })
  await prisma.siteSetting.upsert({
    where: { key: 'sidebar_left_category' },
    update: {},
    create: { key: 'sidebar_left_category', value: '', label: '左侧悬浮按钮分类' },
  })
  await prisma.siteSetting.upsert({
    where: { key: 'sidebar_right_category' },
    update: {},
    create: { key: 'sidebar_right_category', value: '', label: '右侧悬浮按钮分类' },
  })
  await prisma.siteSetting.upsert({
    where: { key: 'sensitive_words' },
    update: {},
    create: {
      key: 'sensitive_words',
      value: '妈的,操你,傻逼,草泥马,他妈的,狗日的,王八蛋,混蛋,滚蛋,去死,白痴,废物,垃圾,贱人,脑残,智障,fuck,shit,damn,bitch,asshole,dick,pussy,wtf',
      label: '评论敏感词（逗号分隔）',
    },
  })

  console.log('Seed data created successfully!')
  console.log('Admin account: admin / admin123')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
