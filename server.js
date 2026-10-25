const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'bubble-admin-1234';
const DB = path.join(__dirname, 'orders.json');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readOrders() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch { return []; }
}
function writeOrders(orders) { fs.writeFileSync(DB, JSON.stringify(orders, null, 2)); }
const menu = [
  {id:'classic',name:'ชานมไต้หวัน',desc:'ชาหอมละมุน นมเข้มข้น',price:45,emoji:'🧋',category:'ชานม'},
  {id:'thai',name:'ชาไทย',desc:'ชาไทยสีส้ม หอมเข้ม',price:45,emoji:'🍊',category:'ชานม'},
  {id:'green',name:'ชาเขียวนม',desc:'ชาเขียวหอม สดชื่น',price:50,emoji:'🍵',category:'ชานม'},
  {id:'cocoa',name:'โกโก้',desc:'โกโก้เข้มข้น ช็อกโกแลตเต็มคำ',price:50,emoji:'🍫',category:'ชานม'},
  {id:'brown',name:'บราวน์ชูการ์',desc:'น้ำตาลทรายแดงหอมหวาน',price:55,emoji:'🤎',category:'ซิกเนเจอร์'},
  {id:'strawberry',name:'ชาสตรอว์เบอร์รี',desc:'ชาผลไม้หวานอมเปรี้ยว',price:50,emoji:'🍓',category:'ชาผลไม้'},
  {id:'lemon',name:'ชามะนาว',desc:'ชาเปรี้ยวสดชื่น',price:40,emoji:'🍋',category:'ชาผลไม้'},
  {id:'taro',name:'เผือกหอม',desc:'เผือกนุ่มละมุน หอมหวาน',price:50,emoji:'💜',category:'ซิกเนเจอร์'}
];
app.get('/api/menu', (_,res) => res.json(menu));
app.post('/api/orders', (req,res) => {
  const {customer,phone,address,items,note,fulfillment} = req.body || {};
  if (!customer || !phone || !address || !Array.isArray(items) || !items.length)
    return res.status(400).json({error:'กรุณากรอกข้อมูลลูกค้าและเลือกเมนูอย่างน้อย 1 รายการ'});
  let total = 0;
  const safeItems = [];
  for (const item of items) {
    const product = menu.find(m => m.id === item.id);
    const qty = Number(item.qty);
    if (!product || !Number.isInteger(qty) || qty < 1 || qty > 20) return res.status(400).json({error:'รายการสินค้าไม่ถูกต้อง'});
    const size = ['M','L'].includes(item.size) ? item.size : 'M';
    const sizeExtra = size === 'L' ? 10 : 0;
    const toppingCatalog = {pearl:10, brownPearl:15, pudding:10, jelly:10, cheese:15};
    const toppings = Array.isArray(item.toppings) ? item.toppings.filter(t => toppingCatalog[t]) : [];
    const toppingPrice = toppings.reduce((s,t)=>s+toppingCatalog[t],0);
    const unit = product.price + sizeExtra + toppingPrice;
    total += unit * qty;
    safeItems.push({id:product.id,name:product.name,qty,size,sizeExtra,sugar:item.sugar || '50%',ice:item.ice || 'ปกติ',toppings,unitPrice:unit,lineTotal:unit*qty});
  }
  const order = {id:'BT-'+Date.now().toString().slice(-8),createdAt:new Date().toISOString(),customer:String(customer).slice(0,100),phone:String(phone).slice(0,30),address:String(address).slice(0,500),fulfillment:fulfillment==='pickup'?'รับที่ร้าน':'จัดส่ง',note:String(note||'').slice(0,500),items:safeItems,total,status:'รอรับออเดอร์'};
  const orders = readOrders(); orders.unshift(order); writeOrders(orders);
  res.status(201).json({order});
});
function adminAuth(req,res,next){
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== ADMIN_KEY) return res.status(401).json({error:'รหัสผู้ดูแลไม่ถูกต้อง'});
  next();
}
app.get('/api/admin/orders',adminAuth,(_,res)=>res.json(readOrders()));
app.patch('/api/admin/orders/:id',adminAuth,(req,res)=>{
  const statuses=['รอรับออเดอร์','กำลังทำ','พร้อมรับ/จัดส่ง','สำเร็จ','ยกเลิก'];
  if(!statuses.includes(req.body.status)) return res.status(400).json({error:'สถานะไม่ถูกต้อง'});
  const orders=readOrders(); const order=orders.find(o=>o.id===req.params.id);
  if(!order) return res.status(404).json({error:'ไม่พบออเดอร์'});
  order.status=req.body.status; writeOrders(orders); res.json({order});
});
app.get('/admin',(_,res)=>res.sendFile(path.join(__dirname,'public','admin.html')));
app.get('*',(_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`Bubble Tea running at http://localhost:${PORT}`));
