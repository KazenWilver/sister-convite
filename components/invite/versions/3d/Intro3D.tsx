"use client";
// Versão 3D (three.js): a Juceline low-poly corre pela Marginal, tropeça, o canudo cai, quica três vezes e rola.
// A câmara percorre um caminho suave (CatmullRom): começa baixa, ao lado dela, roda em órbita enquanto ela corre
// e termina num plano mais alto, a olhar para o canudo pousado.
// Modelo próprio: se existir public/models/juceline.glb (com uma animação de corrida), é usado em vez da
// personagem feita de formas simples.
import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import * as sfx from "@/lib/sound";
import { GOWN, HAIR, SKIN, SKIN_D } from "../../shared/Character";
import { NameTag, nameTagIn, nameTagOut } from "../../shared/NameTag";
import { bounceTrack, rollEase } from "../../shared/tube";
import type { IntroProps } from "../types";
import "./intro3d.css";

const MODEL_URL = "/models/juceline.glb";
const START_X = -6;
const TRIP_X = 0;
const SPEED = 3.6; // unidades (≈ metros) por segundo
const ENTRY_PACE = 0.62;
const TUBE_LEN = 0.62;
const TUBE_R = 0.06;
const ROLL = 2.4; // distância que o canudo rola

type Rig = {
  root: THREE.Group;
  body: THREE.Group;
  hips: [THREE.Group, THREE.Group];
  knees: [THREE.Group, THREE.Group];
  arms: [THREE.Group, THREE.Group];
  tassel: THREE.Group;
  pack: THREE.Object3D;
  headTop: THREE.Object3D;
};

const mat = (c: string) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8, metalness: 0 });
function mesh(geo: THREE.BufferGeometry, m: THREE.Material, cast = true) {
  const o = new THREE.Mesh(geo, m);
  o.castShadow = cast;
  return o;
}

/** Personagem low-poly (pés em y = 0, de frente para +x). */
function buildCharacter(): Rig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = mat(SKIN);
  const skinD = mat(SKIN_D);
  const gown = mat(GOWN);
  const white = mat("#ffffff");
  const blue = mat("#1f5fbf");
  const light = mat("#8dbcf2");
  const hair = mat(HAIR);

  const leg = (z: number, m: THREE.Material) => {
    const hip = new THREE.Group();
    hip.position.set(0, 0.86, z);
    const thigh = mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.44, 6), m);
    thigh.position.y = -0.22;
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    const shin = mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.4, 6), m);
    shin.position.y = -0.2;
    const shoe = mesh(new THREE.BoxGeometry(0.21, 0.07, 0.1), white);
    shoe.position.set(0.05, -0.385, 0);
    knee.add(shin, shoe);
    hip.add(thigh, knee);
    body.add(hip);
    return { hip, knee };
  };
  const L = leg(0.09, skin);
  const R = leg(-0.09, skinD);

  const robe = mesh(new THREE.CylinderGeometry(0.17, 0.34, 0.8, 7), gown);
  robe.position.y = 1.01;
  const collar = mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.05, 7), white);
  collar.position.y = 1.42;
  const stole = [0.075, -0.075].map((z) => {
    const s = mesh(new THREE.BoxGeometry(0.03, 0.46, 0.07), blue);
    s.position.set(0.15, 1.18, z);
    s.rotation.z = 0.12;
    return s;
  });
  const backpack = mesh(new THREE.BoxGeometry(0.13, 0.32, 0.26), mat("#1b4fa0"));
  backpack.position.set(-0.21, 1.14, 0);
  const pack = new THREE.Group();
  const packTube = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.55, 8), white);
  const band = mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.05, 8), blue);
  band.position.y = 0.08;
  pack.add(packTube, band);
  pack.position.set(-0.25, 1.36, 0);
  pack.rotation.z = 0.55;
  body.add(robe, collar, ...stole, backpack, pack);

  const arm = (z: number, m: THREE.Material) => {
    const sh = new THREE.Group();
    sh.position.set(0, 1.33, z);
    const sleeve = mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.5, 6), gown);
    sleeve.position.y = -0.25;
    const hand = mesh(new THREE.IcosahedronGeometry(0.055, 0), m);
    hand.position.y = -0.53;
    sh.add(sleeve, hand);
    body.add(sh);
    return sh;
  };
  const armL = arm(0.24, skin);
  const armR = arm(-0.24, skinD);

  const head = new THREE.Group();
  head.position.y = 1.43;
  const neck = mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 6), skin);
  neck.position.y = 0.04;
  const face = mesh(new THREE.IcosahedronGeometry(0.17, 1), skin);
  face.position.y = 0.25;
  const bun = mesh(new THREE.IcosahedronGeometry(0.15, 1), hair);
  bun.position.set(-0.07, 0.29, 0);
  bun.scale.set(1, 0.95, 1.05);
  const braids = [0.12, -0.12].map((z) => {
    const b = mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.36, 5), hair);
    b.position.set(-0.11, 0.06, z);
    b.rotation.x = z > 0 ? -0.15 : 0.15;
    return b;
  });
  const glasses = [0.065, -0.065].map((z) => {
    const g = mesh(new THREE.TorusGeometry(0.045, 0.011, 4, 10), light, false);
    g.position.set(0.155, 0.27, z);
    g.rotation.y = Math.PI / 2;
    return g;
  });
  const capBase = mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.08, 8), gown);
  capBase.position.y = 0.4;
  const board = mesh(new THREE.BoxGeometry(0.44, 0.025, 0.44), gown);
  board.position.y = 0.45;
  board.rotation.y = Math.PI / 4;
  const button = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 6), light, false);
  button.position.y = 0.47;
  const tassel = new THREE.Group();
  tassel.position.set(0.0, 0.46, 0.2);
  const cord = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), light, false);
  cord.position.y = -0.08;
  const tip = mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.06, 6), light, false);
  tip.position.y = -0.17;
  tassel.add(cord, tip);
  const headTop = new THREE.Object3D();
  headTop.position.y = 0.5;
  head.add(neck, face, bun, ...braids, ...glasses, capBase, board, button, tassel, headTop);
  body.add(head);

  return { root, body, hips: [L.hip, R.hip], knees: [L.knee, R.knee], arms: [armL, armR], tassel, pack, headTop };
}

/** Pose de corrida (phi = fase da passada) misturada com o salto do tropeção (jump 0–1). */
function pose(r: Rig, phi: number, running: boolean, jump: number) {
  const k = running ? 1 : 0;
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const run = {
    hip: [s * 0.75 * k, -s * 0.75 * k],
    knee: [-(0.15 + 1.0 * Math.max(0, c)) * k, -(0.15 + 1.0 * Math.max(0, -c)) * k],
    arm: [-s * 0.8 * k, s * 0.8 * k],
  };
  const J = { hip: [0.95, -0.4], knee: [-1.4, -1.1], arm: [2.4, 2.1] };
  const mix = (a: number, b: number) => a + (b - a) * jump;
  for (const i of [0, 1]) {
    r.hips[i].rotation.z = mix(run.hip[i], J.hip[i]);
    r.knees[i].rotation.z = mix(run.knee[i], J.knee[i]);
    r.arms[i].rotation.z = mix(run.arm[i], J.arm[i]);
  }
  r.body.position.y = Math.abs(s) * 0.05 * k * (1 - jump);
  r.body.rotation.z = -0.12 * k - 0.22 * jump;
  r.tassel.rotation.z = Math.sin(phi * 2) * 0.45 * k;
}

/** A Marginal em formas simples: estrada, passeio, muro, prédios, palmeiras e sol. */
function buildWorld(scene: THREE.Scene) {
  const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 12), new THREE.MeshStandardMaterial({ color: "#0a1f44", roughness: 0.95 }));
  road.rotation.x = -Math.PI / 2;
  road.position.z = 2;
  road.receiveShadow = true;
  scene.add(road);

  const dashGeo = new THREE.BoxGeometry(1.1, 0.01, 0.12);
  const dashes = new THREE.InstancedMesh(dashGeo, new THREE.MeshBasicMaterial({ color: "#d6e8fb" }), 70);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 70; i++) dashes.setMatrixAt(i, m4.makeTranslation(-70 + i * 2.4, 0.006, 3.4));
  scene.add(dashes);

  const side = new THREE.Mesh(new THREE.BoxGeometry(400, 0.2, 2.2), mat("#1f5fbf"));
  side.position.set(0, 0.1, -5.1);
  side.receiveShadow = true;
  const curb = new THREE.Mesh(new THREE.BoxGeometry(400, 0.22, 0.14), mat("#ffffff"));
  curb.position.set(0, 0.11, -3.98);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(400, 0.7, 0.4), mat("#1b4fa0"));
  wall.position.set(0, 0.35, -6.4);
  const wallTop = new THREE.Mesh(new THREE.BoxGeometry(400, 0.06, 0.44), mat("#8dbcf2"));
  wallTop.position.set(0, 0.72, -6.4);
  scene.add(side, curb, wall, wallTop);

  // prédios: duas filas, com cores da paleta (mais claros ao longe, a névoa faz o resto)
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  const bMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 });
  const rows = [
    { z: [-10, -14], colors: ["#4f8fe6", "#6aa2ec", "#1f5fbf", "#8dbcf2"], h: [3.5, 11] },
    { z: [-18, -26], colors: ["#8dbcf2", "#a9cdf5", "#b9d6f7"], h: [6, 16] },
  ];
  let seed = 7;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const list: { x: number; z: number; w: number; d: number; h: number; c: string }[] = [];
  for (const row of rows)
    for (let x = -60; x < 90; ) {
      const w = 2.4 + r() * 3;
      list.push({ x: x + w / 2, z: row.z[0] + (row.z[1] - row.z[0]) * r(), w, d: 2.5 + r() * 3, h: row.h[0] + r() * (row.h[1] - row.h[0]), c: row.colors[Math.floor(r() * row.colors.length)] });
      x += w + 0.4 + r() * 1.6;
    }
  const blds = new THREE.InstancedMesh(bGeo, bMat, list.length);
  const color = new THREE.Color();
  list.forEach((b, i) => {
    blds.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(b.x, b.h / 2, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d)));
    blds.setColorAt(i, color.set(b.c));
  });
  scene.add(blds);

  // palmeiras
  const trunkGeo = new THREE.CylinderGeometry(0.07, 0.12, 3.2, 5);
  const leafGeo = new THREE.ConeGeometry(0.22, 1.7, 4);
  const trunkMat = mat("#12336b");
  const leafMat = mat("#1b4fa0");
  for (let x = -40; x < 60; x += 6.5) {
    const p = new THREE.Group();
    const t = mesh(trunkGeo, trunkMat, false);
    t.position.y = 1.6;
    t.rotation.z = 0.06;
    p.add(t);
    for (let i = 0; i < 6; i++) {
      const l = mesh(leafGeo, leafMat, false);
      l.position.y = 3.15;
      l.rotation.set(0, (i / 6) * Math.PI * 2, 0);
      l.rotateZ(Math.PI / 2 - 0.35);
      l.translateY(0.75);
      l.scale.set(1, 1, 0.35);
      p.add(l);
    }
    p.position.set(x, 0.2, -5.4);
    scene.add(p);
  }

  const sun = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ color: "#ffffff", fog: false }));
  sun.position.set(40, 30, -90);
  scene.add(sun);
}

export function Intro3D({ reduced, onRest }: IntroProps) {
  const host = useRef<HTMLDivElement>(null);
  const tagBox = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = host.current!;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#b7d4f6");
    scene.fog = new THREE.Fog("#cfe3fa", 16, 52);
    scene.add(new THREE.HemisphereLight("#eef5fd", "#0a1f44", 1.25));
    const sunLight = new THREE.DirectionalLight("#ffffff", 2.1);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    Object.assign(sunLight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 40 });
    sunLight.shadow.radius = 4;
    scene.add(sunLight, sunLight.target);
    buildWorld(scene);

    const rig = buildCharacter();
    scene.add(rig.root);
    rig.root.position.x = START_X;

    // canudo solto (escondido até cair da mochila)
    const tube = new THREE.Group();
    const tubeBody = mesh(new THREE.CylinderGeometry(TUBE_R, TUBE_R, TUBE_LEN, 12), mat("#ffffff"));
    const tubeBand = mesh(new THREE.CylinderGeometry(TUBE_R * 1.04, TUBE_R * 1.04, 0.06, 12), mat("#1f5fbf"));
    tubeBand.position.y = 0.12;
    const caps = [1, -1].map((s) => {
      const c = mesh(new THREE.CylinderGeometry(TUBE_R * 1.06, TUBE_R * 1.06, 0.03, 12), mat("#d6e8fb"));
      c.position.y = (s * TUBE_LEN) / 2;
      return c;
    });
    // costura ao comprido: sem ela não se via o canudo a rodar
    const seam = mesh(new THREE.BoxGeometry(0.018, TUBE_LEN * 0.92, 0.014), mat("#8dbcf2"), false);
    seam.position.x = TUBE_R;
    const spin = new THREE.Group(); // roda à volta do eixo do canudo
    spin.add(tubeBody, tubeBand, seam, ...caps);
    spin.rotation.x = Math.PI / 2; // deitado, perpendicular à estrada: rola em x
    tube.add(spin);
    tube.visible = false;
    scene.add(tube);

    // pequenas nuvens de pó em cada pancada
    const puffMat = new THREE.MeshBasicMaterial({ color: "#eef5fd", transparent: true, opacity: 0 });
    const puffs = Array.from({ length: 14 }, () => {
      const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), puffMat.clone());
      scene.add(p);
      return p;
    });
    let puffI = 0;

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = camera.aspect < 1 ? 56 : 42;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);
    // ecrãs ao alto: a câmara recua um pouco para caber a cena
    const back = camera.aspect < 0.75 ? 1.45 : 1;

    const tx0 = TRIP_X - 0.25;
    const tx1 = tx0 + ROLL;
    const path = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(START_X - 4, 1.2, 6.8 * back),
        new THREE.Vector3(START_X + 0.5, 0.9, 4.8 * back),
        new THREE.Vector3(TRIP_X - 1.2, 1.5, 4.4 * back),
        new THREE.Vector3(TRIP_X + 1.8, 2.7, 4.6 * back),
        // plano final mais alto, mas perto: o canudo tem de se ler bem antes de o convite nascer dele
        new THREE.Vector3(tx1 + 1.3, 2.9, 3.4 * back),
        new THREE.Vector3(tx1 + 0.6, 3.2, 2.3 * back),
      ],
      false,
      "centripetal",
    );

    const track = bounceTrack({ h0: 1.25, g: 14, restitution: 0.5, minH: 0.02 });
    const rollDur = track.settle + 1.1;
    const entryDur = (TRIP_X - START_X) / (SPEED * ENTRY_PACE);
    const st = { x: START_X, y: 0, phi: 0, running: false, jump: 0, tripped: false, tubeOn: false, rested: false, sq: 1, cam: 0 };
    const look = new THREE.Vector3(START_X + 0.6, 1, 0);
    const lookGoal = new THREE.Vector3();
    let nextImpact = 0;
    let tubeClock = 0;
    let tagShown = false;
    let tagOn = false;

    function puff(x: number, n: number, size: number) {
      for (let i = 0; i < n; i++) {
        const p = puffs[puffI++ % puffs.length];
        const m = p.material as THREE.MeshBasicMaterial;
        const a = Math.random() * Math.PI * 2;
        p.position.set(x, 0.05, 0);
        p.scale.setScalar(size);
        gsap.killTweensOf([p.position, p.scale, m]);
        gsap.fromTo(m, { opacity: 0.9 }, { opacity: 0, duration: 0.7, ease: "power2.out" });
        gsap.to(p.position, { x: x + Math.cos(a) * 0.45 * size, z: Math.sin(a) * 0.45 * size, y: 0.1 + Math.random() * 0.25 * size, duration: 0.7, ease: "power2.out" });
        gsap.to(p.scale, { x: 0.2, y: 0.2, z: 0.2, duration: 0.7 });
      }
    }

    function trip() {
      st.tripped = true;
      if (tagOn) nameTagOut(tagBox.current);
      sfx.whoosh(0.18);
      gsap
        .timeline()
        .to(st, { jump: 1, duration: 0.12, ease: "power2.out" }, 0)
        .to(st, { y: 0.32, duration: 0.24, ease: "power2.out" }, 0)
        .to(st, { y: 0, duration: 0.24, ease: "power2.in" }, 0.24)
        .to(st, { jump: 0, duration: 0.16, ease: "power2.in" }, 0.34);
      rig.pack.visible = false;
      sfx.ribbon(0.3);
      st.tubeOn = true;
      tube.visible = true;
      tubeClock = 0;
    }

    function impact(strength: number, index: number, x: number) {
      sfx.tubeHit(strength, index);
      puff(x, Math.round(3 + strength * 5), 0.6 + strength);
      gsap.fromTo(st, { sq: 1 - 0.25 * strength }, { sq: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });
    }

    const v = new THREE.Vector3();
    const toScreen = (o: THREE.Object3D | THREE.Vector3) => {
      if (o instanceof THREE.Object3D) o.getWorldPosition(v);
      else v.copy(o);
      v.project(camera);
      return { x: ((v.x + 1) / 2) * el.clientWidth, y: ((1 - v.y) / 2) * el.clientHeight };
    };

    function render() {
      rig.root.position.set(st.x, st.y, 0);
      pose(rig, st.phi, st.running, st.jump);

      if (st.tubeOn) {
        const x = tx0 + (tx1 - tx0) * rollEase(tubeClock, rollDur);
        const hgt = track.heightAt(tubeClock);
        tube.position.set(x, TUBE_R * st.sq + hgt, 0);
        tube.scale.set(2 - st.sq, st.sq, 2 - st.sq);
        spin.rotation.y = -(x - tx0) / TUBE_R; // rola sem escorregar
        tube.rotation.z = 0.5 * Math.max(0, 1 - tubeClock * 3);
      }

      // câmara no caminho; o olhar segue-a e depois procura o canudo
      path.getPointAt(Math.min(1, Math.max(0, st.cam)), camera.position);
      if (st.tripped) lookGoal.set(tube.position.x, 0.15, 0);
      else lookGoal.set(st.x + 0.7, 1.0, 0);
      look.lerp(lookGoal, st.tripped ? 0.06 : 0.2);
      camera.lookAt(look);

      // a luz acompanha a acção para a sombra nunca sair do mapa
      sunLight.position.set(look.x + 5, 11, 7);
      sunLight.target.position.set(look.x, 0, 0);

      if (tagOn && tagBox.current) {
        const p = toScreen(rig.headTop);
        tagBox.current.style.transform = `translate(${(p.x - 89).toFixed(1)}px, ${(p.y - 78).toFixed(1)}px)`;
      }
      renderer.render(scene, camera);
    }

    const tick = (_t: number, dtMs: number) => {
      const dt = Math.min(0.05, dtMs / 1000);
      if (st.running) {
        st.phi += dt * Math.PI * 2 * 1.6;
        if (st.jump === 0) st.x += SPEED * (st.tripped ? 1 : ENTRY_PACE) * dt;
        if (!tagShown && st.x > START_X + 0.4) {
          tagShown = tagOn = true;
          nameTagIn(tagBox.current);
        }
        if (!st.tripped && st.x >= TRIP_X) trip();
        if (st.x > tx1 + 14) st.running = false;
      }
      if (st.tubeOn && !st.rested) {
        tubeClock += dt;
        while (nextImpact < track.impacts.length && tubeClock >= track.impacts[nextImpact].t) {
          const im = track.impacts[nextImpact++];
          impact(im.strength, im.index, tx0 + (tx1 - tx0) * rollEase(im.t, rollDur));
        }
        if (tubeClock >= rollDur) {
          st.rested = true;
          gsap.delayedCall(0.5, rest);
        }
      }
      render();
    };

    function rest() {
      tube.updateWorldMatrix(true, false);
      onRest(toScreen(tube));
    }

    // modelo próprio (opcional)
    let mixer: THREE.AnimationMixer | null = null;
    let cancelled = false;
    void fetch(MODEL_URL, { method: "HEAD" })
      .then(async (r) => {
        if (!r.ok || cancelled) return;
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
        if (cancelled) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const s = 1.75 / Math.max(0.001, box.max.y - box.min.y);
        model.scale.setScalar(s);
        model.position.y = -box.min.y * s;
        model.rotation.y = Math.PI / 2; // glTF olha para +z; aqui ela corre para +x
        model.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o as THREE.Mesh).castShadow = true) : null));
        rig.body.visible = false;
        rig.root.add(model);
        const clip = gltf.animations.find((a) => /run|corr/i.test(a.name)) ?? gltf.animations[0];
        if (clip) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(clip).play();
        }
      })
      .catch(() => {});
    const mixTick = (_t: number, dtMs: number) => {
      mixer?.update(Math.min(0.05, dtMs / 1000));
    };

    let cleanupTimer = 0;
    if (reduced) {
      st.x = tx1 + 20;
      st.tubeOn = st.tripped = st.rested = true;
      tube.visible = true;
      rig.pack.visible = false;
      tubeClock = rollDur;
      st.cam = 1;
      look.set(tx1, 0.15, 0);
      render();
      cleanupTimer = window.setTimeout(rest, 300);
    } else {
      gsap.ticker.add(tick);
      gsap.ticker.add(mixTick);
      render();
    }
    const go = reduced
      ? null
      : gsap.delayedCall(0.8, () => {
          st.running = true;
          gsap.to(st, { cam: 1, duration: entryDur + rollDur + 0.7, ease: "power1.inOut" });
        });

    return () => {
      cancelled = true;
      window.clearTimeout(cleanupTimer);
      go?.kill();
      gsap.killTweensOf(st);
      gsap.ticker.remove(tick);
      gsap.ticker.remove(mixTick);
      window.removeEventListener("resize", resize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mt = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mt)) mt.forEach((x) => x.dispose());
        else mt?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduced, onRest]);

  return (
    <div className="i3d" ref={host}>
      <div className="i3d-tag" ref={tagBox}>
        <svg viewBox="-160 -460 320 180" aria-hidden="true">
          <NameTag color="#0a1f44" />
        </svg>
      </div>
    </div>
  );
}
