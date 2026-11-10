import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const socket = io();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bd2df);
scene.fog = new THREE.Fog(0x9bd2df, 22, 48);
const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, .1, 100);
camera.position.set(0, 14, 18); camera.lookAt(0,0,0);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.querySelector("#game").appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x57705a,2));
const sun = new THREE.DirectionalLight(0xffffff,2.2); sun.position.set(-7,15,8); sun.castShadow=true; scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(34,38),new THREE.MeshStandardMaterial({color:0x5d9d55,roughness:1}));
ground.rotation.x=-Math.PI/2; ground.position.y=-.08; ground.receiveShadow=true; scene.add(ground);
const field = new THREE.Mesh(new THREE.BoxGeometry(9,.12,15),new THREE.MeshStandardMaterial({color:0xd9b77a,roughness:1}));
field.position.y=0; field.receiveShadow=true; scene.add(field);
const lineMat = new THREE.MeshStandardMaterial({color:0xffffff});
function line(x,z,w,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.035,d),lineMat);m.position.set(x,.09,z);scene.add(m)}
line(0,-7.5,9,.12);line(0,7.5,9,.12);line(-4.5,0,.12,15);line(4.5,0,.12,15);
for(let z=-5;z<=5;z+=5) line(0,z,9,.1);
line(0,0,.1,15);
for(let x=-1.5;x<=1.5;x+=3) line(x,0,.1,15);
for(let x of [-5.4,5.4]) for(let z of [-7.5,0,7.5]) {
 const post=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,1.1,8),new THREE.MeshStandardMaterial({color:0x8a5735}));
 post.position.set(x,.55,z);post.castShadow=true;scene.add(post);
}
function makeAvatar(team){
 const group=new THREE.Group(), color=team==="attack"?0x2389ee:0xe34c42;
 const mat=new THREE.MeshStandardMaterial({color,roughness:.75});
 const skin=new THREE.MeshStandardMaterial({color:0xd9a47e});
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.55,4,8),mat);body.position.y=1.05;body.castShadow=true;group.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.23,16,12),skin);head.position.y=1.62;head.castShadow=true;group.add(head);
 const legMat=new THREE.MeshStandardMaterial({color:0x25323a});
 for(let x of [-.13,.13]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.48,8),legMat);leg.position.set(x,.34,0);leg.castShadow=true;group.add(leg)}
 return group;
}
let myId=null,myTeam=null,roomCode="",started=false;
const avatars=new Map(), remoteState=new Map();
let pos=new THREE.Vector3(0,0,6.2), yaw=0, keys={}, touch={x:0,z:0}, lastSend=0;
const lobby=document.querySelector("#lobby"),hud=document.querySelector("#hud");
const roomInput = document.querySelector("#room");
const initialRoom = new URLSearchParams(location.search).get("room");
if (initialRoom) roomInput.value = initialRoom.toUpperCase();
document.querySelector("#join").onclick=()=>socket.emit("join",{name:document.querySelector("#name").value,code:roomInput.value});
socket.on("joined",data=>{
 myId=data.id;myTeam=data.team;roomCode=data.code;pos.set(0,0,myTeam==="attack"?6.2:-6.2);
 lobby.classList.add("hidden");hud.classList.remove("hidden");
 document.querySelector("#roomLabel").textContent="ROOM "+roomCode;
 document.querySelector("#teamLabel").textContent=myTeam==="attack"?"🔵 Tim Penyerang":"🔴 Tim Penjaga";
});
socket.on("errorMessage",msg=>alert(msg));
socket.on("state",state=>{
 started=state.started;
 document.querySelector("#aScore").textContent=state.scores.attack;
 document.querySelector("#gScore").textContent=state.scores.guard;
 document.querySelector("#players").textContent=state.players.length+" pemain";
 document.querySelector("#start").textContent=started?"Ronde berjalan":"Mulai ronde";
 for(const p of state.players){
  remoteState.set(p.id,p);
  if(!avatars.has(p.id)){const a=makeAvatar(p.team);scene.add(a);avatars.set(p.id,a)}
  const a=avatars.get(p.id);a.position.set(p.x,0,p.z);a.rotation.y=p.yaw||0;
 }
 for(const [id,a] of avatars) if(!state.players.some(p=>p.id===id)){scene.remove(a);avatars.delete(id);remoteState.delete(id)}
});
socket.on("notice",msg=>{const t=document.querySelector("#toast");t.textContent=msg;t.style.display="block";clearTimeout(t._timer);t._timer=setTimeout(()=>t.style.display="none",2600)});
document.querySelector("#start").onclick=()=>socket.emit("startGame");
document.querySelector("#share").onclick=async()=>{
 const link = `${location.origin}${location.pathname}?room=${roomCode}`;
 try {
  if (navigator.share) await navigator.share({title:"Gobak Sodor 3D Online",text:`Ayo main Gobak Sodor! Kode room: ${roomCode}`,url:link});
  else { await navigator.clipboard.writeText(link); alert("Link room disalin: "+link); }
 } catch(e) { if(e.name!=="AbortError") alert("Bagikan link ini: "+link); }
};
const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
document.querySelectorAll("[data-dir]").forEach(b=>{
 const d=dirs[b.dataset.dir];const down=e=>{e.preventDefault();touch.x=d[0];touch.z=d[1]};
 const up=e=>{e.preventDefault();touch.x=0;touch.z=0};
 b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);b.addEventListener("pointerleave",up);b.addEventListener("pointercancel",up);
});
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true});
addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false});
function animate(time){
 requestAnimationFrame(animate);
 if(myId && started){
  let dx=touch.x+(keys.a||keys.arrowleft?-1:0)+(keys.d||keys.arrowright?1:0);
  let dz=touch.z+(keys.w||keys.arrowup?-1:0)+(keys.s||keys.arrowdown?1:0);
  const len=Math.hypot(dx,dz);
  if(len){dx/=len;dz/=len;pos.x+=dx*.075;pos.z+=dz*.075;yaw=Math.atan2(dx,dz)}
  pos.x=THREE.MathUtils.clamp(pos.x,-4.05,4.05);pos.z=THREE.MathUtils.clamp(pos.z,-7.05,7.05);
  const me=avatars.get(myId);if(me){me.position.set(pos.x,0,pos.z);me.rotation.y=yaw}
  if(time-lastSend>55){socket.emit("move",{x:pos.x,z:pos.z,yaw});lastSend=time}
 }
 if(myId){const target=new THREE.Vector3(pos.x*.18,0,pos.z*.12);camera.position.x+=(target.x-camera.position.x)*.025;camera.lookAt(target)}
 renderer.render(scene,camera);
}
animate(0);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
