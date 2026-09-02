/**
 * Address-region data used by the local prototype. Replace this adapter with
 * the backend region service without changing PawRegionPicker's contract.
 */
export const REGION_TREE = [
  {
    name: '安徽省',
    children: [
      {
        name: '滁州市',
        children: [
          { name: '南谯区', children: [{ name: '腰铺镇' }, { name: '乌衣镇' }, { name: '沙河镇' }] },
          { name: '琅琊区', children: [{ name: '琅琊街道' }, { name: '扬子街道' }] }
        ]
      },
      {
        name: '合肥市',
        children: [
          { name: '蜀山区', children: [{ name: '三里庵街道' }, { name: '南岗镇' }] },
          { name: '包河区', children: [{ name: '芜湖路街道' }, { name: '骆岗街道' }] }
        ]
      }
    ]
  },
  {
    name: '北京市',
    children: [{
      name: '北京市',
      children: [
        { name: '朝阳区', children: [{ name: '三里屯街道' }, { name: '望京街道' }] },
        { name: '海淀区', children: [{ name: '中关村街道' }, { name: '学院路街道' }] }
      ]
    }]
  },
  {
    name: '广东省',
    children: [{
      name: '广州市',
      children: [
        { name: '天河区', children: [{ name: '珠吉街道' }, { name: '车陂街道' }] },
        { name: '越秀区', children: [{ name: '北京街道' }, { name: '大东街道' }] }
      ]
    }]
  },
  {
    name: '重庆市',
    children: [{
      name: '重庆市',
      children: [
        { name: '渝北区', children: [{ name: '龙溪街道' }, { name: '两路街道' }] },
        { name: '南岸区', children: [{ name: '南坪街道' }, { name: '铜元局街道' }] }
      ]
    }]
  },
  {
    name: '湖南省',
    children: [{
      name: '长沙市',
      children: [
        { name: '雨花区', children: [{ name: '中意一路街道' }, { name: '洞井街道' }] },
        { name: '天心区', children: [{ name: '坡子街街道' }, { name: '暮云街道' }] },
        { name: '岳麓区', children: [{ name: '望月湖街道' }, { name: '梅溪湖街道' }] }
      ]
    }]
  },
  { name: '福建省', children: [] },
  { name: '甘肃省', children: [] },
  { name: '广西壮族自治区', children: [] },
  { name: '贵州省', children: [] },
  { name: '河北省', children: [] },
  { name: '湖北省', children: [] },
  { name: '黑龙江省', children: [] },
  { name: '海南省', children: [] },
  { name: '河南省', children: [] }
]

export const ANHUI_CITY_OPTIONS = [
  '安庆市', '蚌埠市', '亳州市', '滁州市', '池州市', '阜阳市', '淮北市',
  '合肥市', '淮南市', '黄山市', '六安市', '马鞍山市', '宿州市'
].map(name => ({ name, children: [] }))

export function findRegionOptions(parts = [], level = 0, tree = REGION_TREE) {
  let options = Array.isArray(tree) ? tree : []
  for (let index = 0; index < level; index += 1) {
    const picked = parts[index]
    const hit = options.find(item => item.name === picked)
    options = hit && Array.isArray(hit.children) ? hit.children : []
  }
  return options
}

export function findRegionPath(names = [], tree = REGION_TREE) {
  const path = []
  let options = Array.isArray(tree) ? tree : []
  for (const name of names) {
    const item = options.find(option => option.name === name)
    if (!item) break
    path.push(item.name)
    options = Array.isArray(item.children) ? item.children : []
  }
  return path
}
