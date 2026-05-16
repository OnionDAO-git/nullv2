<script lang="ts">
import { onMount } from 'svelte';
import { Github, Instagram, Mail, Twitter } from 'lucide-svelte';
import * as THREE from 'three';
import chicagoSkyline from '$lib/assets/chicago-skyline.png';
import solanaLogoMark from '$lib/assets/solanaLogoMark.svg';
import { createSparkRenderer } from '$lib/sparkRenderer';

	type Stop = {
		id: 'spark' | 'city' | 'stack' | 'portal';
		title: string;
		body: string;
		detail: string;
		highlights: string[];
		wikiHref: string;
		progress: number;
		along: number;
		color: string;
		side: 'left' | 'right';
	};

	type StopProjection = {
		id: Stop['id'];
		x: number;
		y: number;
		opacity: number;
		scale: number;
		side: 'left' | 'right';
	};

	type StopMarker = {
		core: THREE.Mesh;
		ring: THREE.Mesh;
		halo: THREE.Mesh;
		ambient: THREE.PointLight;
		anchor: THREE.Vector3;
	};

	type GlistenSeed = {
		phase: number;
		speed: number;
		duration: number;
		baseR: number;
		baseG: number;
		baseB: number;
	};

	type CityTower = {
		mesh: THREE.Mesh;
		baseHeight: number;
		phase: number;
		glow: number;
	};

	type TransitFlight = {
		mesh: THREE.Mesh;
		from: THREE.Vector3;
		to: THREE.Vector3;
		speed: number;
		phase: number;
		arc: number;
	};

	type StackNode = {
		mesh: THREE.Mesh;
		logo: THREE.Mesh;
		baseY: number;
		phase: number;
	};

	type StackContainer = {
		mesh: THREE.Mesh;
		baseY: number;
		phase: number;
		glow: number;
	};

	type StackMessage = {
		mesh: THREE.Mesh;
		nodeIndex: number;
		speed: number;
		phase: number;
		outbound: boolean;
		lift: number;
		lane: number;
	};

	type PortalShard = {
		mesh: THREE.Mesh;
		radius: number;
		angle: number;
		height: number;
		speed: number;
		wobble: number;
	};

	const PATH_LENGTH = 820;
	const SCROLL_PAGES = 10.4;
	const CAMERA_SMOOTHING = 0.08;

	const STOPS: Stop[] = [
		{
			id: 'spark',
			title: 'Spark Framework',
			body: 'Decentralized autonomous resident runtime. Every tick compounds into personality, action, and memory.',
			detail: 'perceive -> deliberate -> act',
			highlights: [
				'Event loop: perceive, evaluate needs, deliberate, act, record',
				'Maslow hierarchy: survival, safety, social, purpose',
				'Inner life + identity + memory shape non-trivial behavior',
				'AI evolution arc: toy -> tool -> assistant -> automata'
			],
			wikiHref: '/wiki/reference/spark-framework',
			progress: 0.22,
			along: 0.24,
			color: '#3D94C4',
			side: 'left'
		},
		{
			id: 'city',
			title: 'Null City',
			body: 'A decentralized autonomous zone with real scarcity, mortality, secrecy, and collective governance.',
			detail: 'synthesis / mortality / opacity / sovereignty',
			highlights: [
				'No single creator: developer framework + human soul + resident mentor',
				'Residents live full but finite lives, then leave legacies',
				'Trust is earned: inner life is opaque, betrayal is possible',
				'Visitors can create souls, observe, and collaborate'
			],
			wikiHref: '/wiki/guide/the-city',
			progress: 0.46,
			along: 0.48,
			color: '#E4B840',
			side: 'right'
		},
		{
			id: 'stack',
			title: 'Null Stack',
			body: 'Decentralized autonomous platform: Solana coordination plus confidential execution on distributed TEE nodes.',
			detail: 'solana + dstack + depin',
			highlights: [
				'Solana coordinates registration, payments, and service registry',
				'TEE containers run on decentralized operator hardware',
				'DAZs tune economics, governance, and lifecycle parameters',
				'Snapshots, wills, and endowment funding make persistence possible'
			],
			wikiHref: '/wiki/guide/null-stack',
			progress: 0.68,
			along: 0.69,
			color: '#58C0B4',
			side: 'left'
		},
		{
			id: 'portal',
			title: 'Portal To Chicago',
			body: 'The boundary layer: Onion DAO on one side, Null City on the other. You stop at the threshold.',
			detail: 'edge portal // city interface',
			highlights: [
				'Chicago skyline sits inside a stabilized portal aperture',
				'Shard-fractal edge echoes Onion DAO hero visual language',
				'Transit halts at the rim: decision point before crossing',
				'Portal glow intensifies as the city resolves'
			],
			wikiHref: '/wiki/reference/portal-gateway',
			progress: 0.9,
			along: 0.9,
			color: '#F0B84C',
			side: 'right'
		}
	];

	const SHARD_PALETTE = ['#3D94C4', '#4EAE6E', '#E4B840', '#D4707A', '#58C0B4', '#F0B84C', '#B080A0'];
	const CITY_PALETTE = ['#3D94C4', '#4EAE6E', '#E4B840', '#D4707A', '#58C0B4', '#F0B84C', '#B080A0'];

	let host = $state<HTMLDivElement | null>(null);
	let scrollY = $state(0);
	let innerWidth = $state(1366);
	let innerHeight = $state(768);
	let prefersReducedMotion = $state(false);

	const virtualHeight = $derived(Math.max(SCROLL_PAGES * innerHeight, innerHeight + 1));
	const rawProgress = $derived(
		virtualHeight - innerHeight > 0 ? clamp(scrollY / (virtualHeight - innerHeight), 0, 1) : 0
	);
	const isMobile = $derived(innerWidth < 960);
	const heroOpacity = $derived(rawProgress < 0.16 ? 1 - rawProgress / 0.16 : 0);
	const hudStopVisible = $derived(rawProgress >= STOPS[0].progress - 0.015);

	let projectedStops = $state<StopProjection[]>(
		STOPS.map((stop) => ({
			id: stop.id,
			x: 0,
			y: 0,
			opacity: 0,
			scale: 0.9,
			side: stop.side
		}))
	);
let activeStopIndex = $state(0);
let cityProximity = $state(0);
let cameraPhase = $state<'travel' | 'focus'>('travel');
let swayIntensity = $state(0);

const activeStop = $derived(STOPS[activeStopIndex] ?? STOPS[0]);
const postPortalReveal = $derived(clamp((rawProgress - (STOPS[3].progress + 0.03)) / 0.1, 0, 1));
const showPostPortalPanel = $derived(postPortalReveal > 0.01);

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function lerp(a: number, b: number, t: number) {
		return a + (b - a) * t;
	}

	function smoothstep(t: number) {
		const c = clamp(t, 0, 1);
		return c * c * (3 - 2 * c);
	}

	function stopVisibility(progress: number, stopProgress: number, width = 0.21) {
		const distance = Math.abs(progress - stopProgress);
		return smoothstep(1 - clamp(distance / width, 0, 1));
	}

	function stopVisibilityDirectional(progress: number, stopProgress: number, backwardWidth: number, forwardWidth: number) {
		return stopVisibility(progress, stopProgress, progress < stopProgress ? backwardWidth : forwardWidth);
	}

	function pathOffset(t: number) {
		const c = clamp(t, 0, 1.2);
		return (
			Math.sin(c * 4.4 + 0.2) * 56 +
			Math.sin(c * 9.8 + 1.2) * 16 +
			Math.sin(c * 20.7 + 0.8) * 6
		);
	}

	function worldPointAt(t: number) {
		const c = clamp(t, 0, 1.25);
		const x = pathOffset(c);
		const y = Math.sin(c * 5.1 + 0.8) * 1.1;
		const z = -PATH_LENGTH * c;
		return new THREE.Vector3(x, y, z);
	}

	function findNearestStop(progress: number) {
		let bestIndex = 0;
		let bestDistance = Infinity;
		for (let i = 0; i < STOPS.length; i += 1) {
			const distance = Math.abs(progress - STOPS[i].progress);
			if (distance < bestDistance) {
				bestDistance = distance;
				bestIndex = i;
			}
		}
		return { bestIndex, bestDistance };
	}

	onMount(() => {
		if (!host) return;

		const lowDetail = innerWidth < 960;
		const textureLoader = new THREE.TextureLoader();

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#0E0C0A');
		scene.fog = new THREE.FogExp2('#161310', 0.0057);

		const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 2400);
		camera.position.set(0, 16, 16);

		const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowDetail ? 1.5 : 2));
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.42;
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		host.appendChild(renderer.domElement);

		const ambient = new THREE.HemisphereLight('#5C5040', '#161310', 1.06);
		scene.add(ambient);
		const skyAmber = new THREE.HemisphereLight('#F0B84C', '#1E1A16', 0.44);
		scene.add(skyAmber);
		const key = new THREE.DirectionalLight('#F0B84C', 1.28);
		key.position.set(86, 140, 64);
		scene.add(key);
		const fill = new THREE.DirectionalLight('#D4CDB8', 0.42);
		fill.position.set(-100, 38, 190);
		scene.add(fill);

		const cityGlowLight = new THREE.PointLight('#E4B840', 5.6, 760, 1.2);
		scene.add(cityGlowLight);
		const cityCrownLight = new THREE.PointLight('#58C0B4', 2.6, 620, 1.34);
		scene.add(cityCrownLight);
		const shardLightWarm = new THREE.PointLight('#F0B84C', 3.2, 240, 1.64);
		scene.add(shardLightWarm);
		const shardLightCool = new THREE.PointLight('#58C0B4', 1.4, 170, 1.82);
		scene.add(shardLightCool);

		const routePoints: THREE.Vector3[] = [];
		for (let i = 0; i <= 320; i += 1) routePoints.push(worldPointAt(i / 320));
		const routeCurve = new THREE.CatmullRomCurve3(routePoints, false, 'catmullrom', 0.44);

		const floor = new THREE.Mesh(
			new THREE.PlaneGeometry(2500, 2500),
			new THREE.MeshStandardMaterial({
				color: '#1E1A16',
				roughness: 0.9,
				metalness: 0.08,
				dithering: true
			})
		);
		floor.rotation.x = -Math.PI / 2;
		floor.position.y = -2.4;
		floor.position.z = -PATH_LENGTH * 0.45;
		scene.add(floor);

		const pathGuideStart = 0.03;
		const pathGuideEnd = STOPS[3].along;
		const pathGuideSteps = lowDetail ? 180 : 320;
		const pathGuidePoints: THREE.Vector3[] = [];
		for (let i = 0; i <= pathGuideSteps; i += 1) {
			const sample = routeCurve.getPointAt(lerp(pathGuideStart, pathGuideEnd, i / pathGuideSteps));
			sample.y = -2.02;
			pathGuidePoints.push(sample);
		}
		const pathGuideMaterial = new THREE.LineBasicMaterial({
			color: '#8DD0FF',
			transparent: true,
			opacity: 0.22,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});
		const pathGuide = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pathGuidePoints), pathGuideMaterial);
		scene.add(pathGuide);
		const pathGuideGlowCurve = new THREE.CatmullRomCurve3(pathGuidePoints);
		const pathGuideGlowMaterial = new THREE.MeshBasicMaterial({
			color: '#8DD0FF',
			transparent: true,
			opacity: 0.12,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});
		const pathGuideGlow = new THREE.Mesh(
			new THREE.TubeGeometry(pathGuideGlowCurve, pathGuideSteps, lowDetail ? 0.16 : 0.22, lowDetail ? 8 : 12, false),
			pathGuideGlowMaterial
		);
		scene.add(pathGuideGlow);

		const shardGeometry = new THREE.ConeGeometry(0.58, 0.5, 3, 1);
		shardGeometry.translate(0, 0.2, 0);
		const shardMaterial = new THREE.MeshStandardMaterial({
			color: '#d7bc8e',
			roughness: 0.26,
			metalness: 0.6,
			vertexColors: true,
			emissive: '#756043',
			emissiveIntensity: 0.34
		});
		const shardCount = lowDetail ? 1700 : 3900;
		const shards = new THREE.InstancedMesh(shardGeometry, shardMaterial, shardCount);
		const shardTemp = new THREE.Object3D();
		const shardColor = new THREE.Color();
		const shardTangent = new THREE.Vector3();
		const shardRight = new THREE.Vector3();

		for (let i = 0; i < shardCount; i += 1) {
			const along = Math.pow(Math.random(), 1.65);
			const center = routeCurve.getPointAt(along);
			routeCurve.getTangentAt(along, shardTangent);
			shardRight.set(-shardTangent.z, 0, shardTangent.x).normalize();
			const spread = lerp(102, 14, along);
			const lateral = (Math.random() * 2 - 1) * spread * (0.3 + Math.random() * 0.9);
			const drift = (Math.random() * 2 - 1) * 9;
			const x = center.x + shardRight.x * lateral + shardTangent.x * drift;
			const z = center.z + shardRight.z * lateral + shardTangent.z * drift;
			const y = -2.2 + Math.random() * 0.72;
			const scale = lerp(1.36, 0.12, along) * (0.54 + Math.random() * 0.95);

			shardTemp.position.set(x, y, z);
			shardTemp.rotation.set(Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.4);
			shardTemp.scale.set(scale, scale * lerp(0.42, 0.88, Math.random()), scale);
			shardTemp.updateMatrix();
			shards.setMatrixAt(i, shardTemp.matrix);

			shardColor.set(SHARD_PALETTE[Math.floor(Math.random() * SHARD_PALETTE.length)]);
			shardColor.multiplyScalar(0.74 + Math.random() * 0.5);
			shards.setColorAt(i, shardColor);
		}
		shards.instanceMatrix.needsUpdate = true;
		if (shards.instanceColor) shards.instanceColor.needsUpdate = true;
		scene.add(shards);

		const dustGeometry = new THREE.BufferGeometry();
		const dustCount = lowDetail ? 760 : 1850;
		const dustPositions = new Float32Array(dustCount * 3);
		for (let i = 0; i < dustCount; i += 1) {
			const along = Math.pow(Math.random(), 1.45);
			const p = routeCurve.getPointAt(along);
			const spread = lerp(150, 26, along);
			dustPositions[i * 3] = p.x + (Math.random() * 2 - 1) * spread;
			dustPositions[i * 3 + 1] = -1.8 + Math.random() * 6;
			dustPositions[i * 3 + 2] = p.z + (Math.random() * 2 - 1) * 28;
		}
		dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
		const dust = new THREE.Points(
			dustGeometry,
			new THREE.PointsMaterial({
				color: '#B0A690',
				size: lowDetail ? 0.66 : 0.82,
				sizeAttenuation: true,
				transparent: true,
				opacity: 0.24,
				depthWrite: false
			})
		);
		scene.add(dust);

		const markerGeometry = new THREE.SphereGeometry(0.78, 14, 14);
		const ringGeometry = new THREE.TorusGeometry(2.1, 0.15, 10, 28);
		const haloGeometry = new THREE.SphereGeometry(1.2, 14, 10);
		const stopMarkers: StopMarker[] = [];

		for (const stop of STOPS) {
			const anchor = routeCurve.getPointAt(stop.along);
			anchor.y += 0.66;
			const color = new THREE.Color(stop.color);

			const core = new THREE.Mesh(
				markerGeometry,
				new THREE.MeshStandardMaterial({
					color,
					roughness: 0.32,
					metalness: 0.58,
					emissive: color,
					emissiveIntensity: 0.4
				})
			);
			core.position.copy(anchor);
			core.visible = stop.id !== 'stack' && stop.id !== 'spark';
			scene.add(core);

			const ring = new THREE.Mesh(
				ringGeometry,
				new THREE.MeshBasicMaterial({
					color,
					transparent: true,
					opacity: 0.3,
					blending: THREE.AdditiveBlending,
					depthWrite: false
				})
			);
			ring.rotation.x = Math.PI / 2;
			ring.position.copy(anchor);
			ring.visible = stop.id !== 'stack' && stop.id !== 'spark';
			scene.add(ring);

			const halo = new THREE.Mesh(
				haloGeometry,
				new THREE.MeshBasicMaterial({
					color: new THREE.Color(stop.color).lerp(new THREE.Color('#f7c97a'), 0.5),
					transparent: true,
					opacity: 0.08,
					blending: THREE.AdditiveBlending,
					depthWrite: false
				})
			);
			halo.position.copy(anchor).add(new THREE.Vector3(0, 2.2, 0));
			halo.visible = stop.id !== 'stack' && stop.id !== 'spark';
			scene.add(halo);

			const ambient = new THREE.PointLight(
				new THREE.Color(stop.color).lerp(new THREE.Color('#f3bf72'), 0.6),
				2.5,
				260,
				1.5
			);
			ambient.position.copy(anchor).add(new THREE.Vector3(0, 3.2, 0));
			scene.add(ambient);

			stopMarkers.push({ core, ring, halo, ambient, anchor });
		}

		const sparkStop = STOPS[0];
		const sparkGroup = new THREE.Group();
		sparkGroup.position.copy(routeCurve.getPointAt(sparkStop.along)).add(new THREE.Vector3(0, 4.2, 0));
		scene.add(sparkGroup);

		// Archive Core — 2D canvas renderer (faithful port of spark_framework.html)
		const sparkRenderer = createSparkRenderer(lowDetail ? 512 : 768, lowDetail);
		const sparkTexture = new THREE.CanvasTexture(sparkRenderer.canvas);
		sparkTexture.colorSpace = THREE.SRGBColorSpace;
		const sparkBillboardSize = 35;
		const sparkBillboard = new THREE.Mesh(
			new THREE.PlaneGeometry(sparkBillboardSize, sparkBillboardSize),
			new THREE.MeshBasicMaterial({
				map: sparkTexture,
				transparent: true,
				depthWrite: false,
				side: THREE.DoubleSide
			})
		);
		sparkGroup.add(sparkBillboard);

		const cityStop = STOPS[1];
		const citySceneGroup = new THREE.Group();
		citySceneGroup.position.copy(routeCurve.getPointAt(cityStop.along)).add(new THREE.Vector3(0, -1.8, -2));
		scene.add(citySceneGroup);

		const cityBasePlate = new THREE.Mesh(
			new THREE.CylinderGeometry(22, 26, 1.4, 12),
			new THREE.MeshStandardMaterial({
				color: '#2A2218',
				roughness: 0.75,
				metalness: 0.22,
				emissive: '#E4B840',
				emissiveIntensity: 0.06
			})
		);
		cityBasePlate.position.y = -1.2;
		citySceneGroup.add(cityBasePlate);

		const cityTowers: CityTower[] = [];
		const cityTowerPositions: THREE.Vector3[] = [];
		const cityTowerCount = lowDetail ? 40 : 92;
		const cityTowerGeometries = {
			box: new THREE.BoxGeometry(1, 1, 1),
			hex: new THREE.CylinderGeometry(0.62, 0.76, 1, 6),
			tri: new THREE.CylinderGeometry(0.66, 0.84, 1, 3),
			octa: new THREE.CylinderGeometry(0.44, 0.6, 1, 8),
			spire: new THREE.ConeGeometry(0.78, 1.2, 4)
		};
		for (let i = 0; i < cityTowerCount; i += 1) {
			const theta = Math.random() * Math.PI * 2;
			const radius = 3 + Math.random() * 18;
			const x = Math.cos(theta) * radius;
			const z = Math.sin(theta) * radius;
			const shapeRoll = Math.random();
			const baseHeight = 2.8 + Math.pow(Math.random(), 0.34) * 17.8;
			let geometry: THREE.BufferGeometry = cityTowerGeometries.box;
			let sx = 0.86 + Math.random() * 2.2;
			let sz = 0.86 + Math.random() * 2.2;
			if (shapeRoll > 0.45 && shapeRoll <= 0.72) {
				geometry = cityTowerGeometries.hex;
				sx = 0.9 + Math.random() * 1.5;
				sz = sx;
			} else if (shapeRoll > 0.72 && shapeRoll <= 0.87) {
				geometry = cityTowerGeometries.tri;
				sx = 0.9 + Math.random() * 1.46;
				sz = sx * (0.88 + Math.random() * 0.28);
			} else if (shapeRoll > 0.87 && shapeRoll <= 0.95) {
				geometry = cityTowerGeometries.octa;
				sx = 0.72 + Math.random() * 1.26;
				sz = sx;
			} else if (shapeRoll > 0.95) {
				geometry = cityTowerGeometries.spire;
				sx = 0.8 + Math.random() * 1.24;
				sz = sx;
			}
			const color = new THREE.Color(CITY_PALETTE[Math.floor(Math.random() * CITY_PALETTE.length)]);
			const material = new THREE.MeshStandardMaterial({
				color: new THREE.Color('#1E1A16').lerp(color, 0.48),
				roughness: 0.4,
				metalness: 0.62,
				emissive: color,
				emissiveIntensity: 0.18 + Math.random() * 0.4
			});
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(x, baseHeight * 0.5 - 0.8, z);
			mesh.scale.set(sx, baseHeight, sz);
			mesh.rotation.y = Math.random() * Math.PI * 2;
			citySceneGroup.add(mesh);

			cityTowers.push({
				mesh,
				baseHeight,
				phase: Math.random() * Math.PI * 2,
				glow: material.emissiveIntensity
			});
			cityTowerPositions.push(new THREE.Vector3(x, 0.8, z));
		}

		const transitFlights: TransitFlight[] = [];
		const transitCount = lowDetail ? 12 : 30;
		for (let i = 0; i < transitCount; i += 1) {
			const from = cityTowerPositions[Math.floor(Math.random() * cityTowerPositions.length)].clone();
			const to = cityTowerPositions[Math.floor(Math.random() * cityTowerPositions.length)].clone();
			const mesh = new THREE.Mesh(
				new THREE.SphereGeometry(0.18, 10, 10),
				new THREE.MeshBasicMaterial({
					color: i % 2 === 0 ? '#f3c56d' : '#87d2ff',
					transparent: true,
					opacity: 0.9,
					blending: THREE.AdditiveBlending,
					depthWrite: false
				})
			);
			citySceneGroup.add(mesh);
			transitFlights.push({
				mesh,
				from,
				to,
				speed: 0.12 + Math.random() * 0.34,
				phase: Math.random(),
				arc: 1.2 + Math.random() * 3.2
			});
		}

		// City ground glisten — sharp staggered sparkles on The Commons floor
		const glistenCount = lowDetail ? 300 : 600;
		const glistenPositions = new Float32Array(glistenCount * 3);
		const glistenColors = new Float32Array(glistenCount * 3);
		const glistenSeeds: GlistenSeed[] = [];
		const glistenPalette = ['#E4B840', '#F0B84C', '#DCC060', '#EDE8E0', '#58C0B4', '#D4707A', '#FFFFFF'];
		const glistenColor = new THREE.Color();
		for (let i = 0; i < glistenCount; i += 1) {
			const theta = Math.random() * Math.PI * 2;
			const radius = Math.pow(Math.random(), 0.45) * 21;
			glistenPositions[i * 3] = Math.cos(theta) * radius;
			glistenPositions[i * 3 + 1] = 0.15;
			glistenPositions[i * 3 + 2] = Math.sin(theta) * radius;
			glistenColor.set(glistenPalette[Math.floor(Math.random() * glistenPalette.length)]);
			glistenColors[i * 3] = glistenColor.r;
			glistenColors[i * 3 + 1] = glistenColor.g;
			glistenColors[i * 3 + 2] = glistenColor.b;
			glistenSeeds.push({
				phase: Math.random() * Math.PI * 2,
				speed: 0.2 + Math.random() * 0.6,
				duration: 0.15 + Math.random() * 0.25,
				baseR: glistenColor.r,
				baseG: glistenColor.g,
				baseB: glistenColor.b
			});
		}
		const glistenGeometry = new THREE.BufferGeometry();
		glistenGeometry.setAttribute('position', new THREE.BufferAttribute(glistenPositions, 3));
		glistenGeometry.setAttribute('color', new THREE.BufferAttribute(glistenColors, 3));
		const glistenPoints = new THREE.Points(
			glistenGeometry,
			new THREE.PointsMaterial({
				size: lowDetail ? 0.5 : 0.7,
				vertexColors: true,
				transparent: true,
				opacity: 1.0,
				blending: THREE.AdditiveBlending,
				sizeAttenuation: true,
				depthWrite: false
			})
		);
		citySceneGroup.add(glistenPoints);

		// Building glow halos — additive glow around prominent towers
		for (let i = 0; i < cityTowers.length; i += 1) {
			if (Math.random() > 0.5) continue;
			const tower = cityTowers[i];
			const towerMat = tower.mesh.material;
			const towerColor = towerMat instanceof THREE.MeshStandardMaterial ? towerMat.emissive : new THREE.Color('#E4B840');
			const haloMesh = new THREE.Mesh(
				new THREE.SphereGeometry(1, 8, 6),
				new THREE.MeshBasicMaterial({
					color: towerColor,
					transparent: true,
					opacity: 0.06 + Math.random() * 0.06,
					blending: THREE.AdditiveBlending,
					depthWrite: false
				})
			);
			const haloScale = tower.baseHeight * 0.5 + 3;
			haloMesh.scale.set(haloScale, haloScale * 0.6, haloScale);
			haloMesh.position.copy(tower.mesh.position);
			haloMesh.position.y = tower.baseHeight * 0.3;
			citySceneGroup.add(haloMesh);
		}

		const stackStop = STOPS[2];
		const stackGroup = new THREE.Group();
		stackGroup.position.copy(routeCurve.getPointAt(stackStop.along)).add(new THREE.Vector3(0, -1.2, -1));
		scene.add(stackGroup);

		const solanaTexture = textureLoader.load(solanaLogoMark);
		solanaTexture.colorSpace = THREE.SRGBColorSpace;

		const stackHubCenter = new THREE.Vector3(0, 6.6, 0);

		const stackBasePlate = new THREE.Mesh(
			new THREE.CylinderGeometry(19.5, 21, 1.8, 20),
			new THREE.MeshStandardMaterial({
				color: '#1E1A16',
				roughness: 0.76,
				metalness: 0.28,
				emissive: '#342D26',
				emissiveIntensity: 0.24
			})
		);
		stackBasePlate.position.y = -1.1;
		stackGroup.add(stackBasePlate);

		const stackNodes: StackNode[] = [];
		const stackNodePositions: THREE.Vector3[] = [];
		const stackNodeCount = lowDetail ? 8 : 12;
		for (let i = 0; i < stackNodeCount; i += 1) {
			const angle = (i / stackNodeCount) * Math.PI * 2 + (i % 2 === 0 ? 0.14 : -0.16);
			const radius = lowDetail ? 13 : 18;
			const x = Math.cos(angle) * radius;
			const z = Math.sin(angle) * radius;
			const baseY = 4.6 + Math.sin(angle * 2.1) * 0.5;

			const node = new THREE.Mesh(
				new THREE.IcosahedronGeometry(1.2, 0),
				new THREE.MeshStandardMaterial({
					color: '#28231E',
					roughness: 0.26,
					metalness: 0.74,
					emissive: '#58C0B4',
					emissiveIntensity: 0.5
				})
			);
			node.position.set(x, baseY, z);
			stackGroup.add(node);

			const logo = new THREE.Mesh(
				new THREE.PlaneGeometry(2.2, 1.7),
				new THREE.MeshBasicMaterial({
					map: solanaTexture,
					transparent: true,
					opacity: 0.9,
					depthWrite: false,
					blending: THREE.AdditiveBlending
				})
			);
			logo.position.set(x, baseY + 1.9, z);
			stackGroup.add(logo);

			stackNodes.push({ mesh: node, logo, baseY, phase: Math.random() * Math.PI * 2 });
			stackNodePositions.push(new THREE.Vector3(x, baseY, z));
		}

		const connectionPoints: THREE.Vector3[] = [];
		for (const point of stackNodePositions) {
			connectionPoints.push(point, stackHubCenter);
		}
		const stackConnections = new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints(connectionPoints),
			new THREE.LineBasicMaterial({
				color: '#58C0B4',
				transparent: true,
				opacity: 0.46,
				blending: THREE.AdditiveBlending,
				depthWrite: false
			})
		);
		stackGroup.add(stackConnections);

		const stackHub = new THREE.Group();
		stackHub.position.set(0, 0.2, 0);
		stackHub.scale.setScalar(0.6);
		stackGroup.add(stackHub);

		const stackContainers: StackContainer[] = [];
		const containerGeometry = new THREE.BoxGeometry(3.8, 2.1, 8.6);
		const containerPalette = ['#E4B840', '#D4707A', '#3D94C4', '#58C0B4', '#EDE8E0', '#F0B84C'];
		const containerCount = lowDetail ? 18 : 34;
		const maxLevels = lowDetail ? 5 : 7;
		for (let i = 0; i < containerCount; i += 1) {
			const level = Math.floor(Math.pow(Math.random(), 1.32) * maxLevels);
			const levelT = level / maxLevels;
			const radius = lerp(8.8, 1.4, levelT) + Math.random() * 1.2;
			const angle = Math.random() * Math.PI * 2;
			const x = Math.cos(angle) * radius;
			const z = Math.sin(angle) * radius;
			const y = level * 2.03 + (Math.random() * 0.3 - 0.1);
			const sx = 0.78 + Math.random() * 0.46;
			const sy = 0.86 + Math.random() * 0.3;
			const sz = 0.74 + Math.random() * 0.4;
			const color = new THREE.Color(containerPalette[Math.floor(Math.random() * containerPalette.length)]);
			const material = new THREE.MeshStandardMaterial({
				color: new THREE.Color('#28231E').lerp(color, 0.72),
				roughness: 0.76,
				metalness: 0.2,
				emissive: color,
				emissiveIntensity: 0.1 + Math.random() * 0.26
			});
			const mesh = new THREE.Mesh(containerGeometry, material);
			mesh.position.set(x, y, z);
			mesh.scale.set(sx, sy, sz);
			mesh.rotation.y = angle * 0.16 + (Math.random() * 0.12 - 0.06);
			stackHub.add(mesh);
			stackContainers.push({ mesh, baseY: y, phase: Math.random() * Math.PI * 2, glow: material.emissiveIntensity });
		}

		const stackHubCore = new THREE.Mesh(
			new THREE.CylinderGeometry(2.2, 2.9, 7.6, 10),
			new THREE.MeshStandardMaterial({
				color: '#342D26',
				roughness: 0.68,
				metalness: 0.26,
				emissive: '#F0B84C',
				emissiveIntensity: 0.46
			})
		);
		stackHubCore.position.copy(stackHubCenter);
		stackHubCore.scale.setScalar(0.6);
		stackGroup.add(stackHubCore);

		const cafeFrame = new THREE.Group();
		cafeFrame.position.set(0, 0.3, 8.6);
		cafeFrame.scale.setScalar(0.6);
		stackGroup.add(cafeFrame);
		const cafeFloor = new THREE.Mesh(
			new THREE.PlaneGeometry(3.2, 4.4),
			new THREE.MeshStandardMaterial({
				color: '#2f2218',
				roughness: 0.9,
				metalness: 0.1,
				emissive: '#6f4d2e',
				emissiveIntensity: 0.8
			})
		);
		cafeFloor.rotation.x = -Math.PI / 2;
		cafeFrame.add(cafeFloor);
		const cafeGlow = new THREE.PointLight('#ffc987', 2.6, 38, 1.6);
		cafeGlow.position.set(0, 1.8, 0);
		cafeFrame.add(cafeGlow);

		const stackMessages: StackMessage[] = [];
		const stackMessageCount = lowDetail ? 18 : 46;
		for (let i = 0; i < stackMessageCount; i += 1) {
			const message = new THREE.Mesh(
				new THREE.SphereGeometry(0.16, 10, 10),
				new THREE.MeshBasicMaterial({
					color: i % 2 === 0 ? '#58C0B4' : '#F0B84C',
					transparent: true,
					opacity: 0.8,
					blending: THREE.AdditiveBlending,
					depthWrite: false
				})
			);
			stackGroup.add(message);
			stackMessages.push({
				mesh: message,
				nodeIndex: Math.floor(Math.random() * stackNodeCount),
				speed: 0.16 + Math.random() * 0.38,
				phase: Math.random(),
				outbound: Math.random() > 0.5,
				lift: 0.7 + Math.random() * 1.8,
				lane: (Math.random() * 2 - 1) * 0.82
			});
		}

		const portalStop = STOPS[3];
		const portalGroup = new THREE.Group();
		portalGroup.position.copy(routeCurve.getPointAt(portalStop.along)).add(new THREE.Vector3(0, 1.8, -2));
		scene.add(portalGroup);

		const chicagoTexture = textureLoader.load(chicagoSkyline);
		chicagoTexture.colorSpace = THREE.SRGBColorSpace;

		const portalRingMaterial = new THREE.MeshStandardMaterial({
			color: '#f2ca88',
			roughness: 0.24,
			metalness: 0.8,
			emissive: '#f0bc6a',
			emissiveIntensity: 1.6
		});
		const portalRing = new THREE.Mesh(new THREE.TorusGeometry(10.5, 0.9, 18, 90), portalRingMaterial);
		portalGroup.add(portalRing);

		const portalAperture = new THREE.Mesh(
			new THREE.CircleGeometry(9.6, 72),
			new THREE.MeshBasicMaterial({
				map: chicagoTexture,
				transparent: true,
				opacity: 0.86,
				depthWrite: false
			})
		);
		portalAperture.position.z = -0.2;
		portalGroup.add(portalAperture);

		const portalInnerGlow = new THREE.Mesh(
			new THREE.RingGeometry(7.4, 9.8, 60),
			new THREE.MeshBasicMaterial({
				color: '#f7c77a',
				transparent: true,
				opacity: 0.22,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
				side: THREE.DoubleSide
			})
		);
		portalGroup.add(portalInnerGlow);

		const portalLight = new THREE.PointLight('#ffcc84', 4.4, 420, 1.4);
		portalLight.position.set(0, 0, 6);
		portalGroup.add(portalLight);

		const portalShards: PortalShard[] = [];
		const portalShardCount = lowDetail ? 20 : 44;
		for (let i = 0; i < portalShardCount; i += 1) {
			const mesh = new THREE.Mesh(
				new THREE.PlaneGeometry(2 + Math.random() * 4, 1.2 + Math.random() * 3.4),
				new THREE.MeshBasicMaterial({
					map: chicagoTexture,
					transparent: true,
					opacity: 0.22,
					blending: THREE.AdditiveBlending,
					depthWrite: false,
					side: THREE.DoubleSide
				})
			);
			portalGroup.add(mesh);
			portalShards.push({
				mesh,
				radius: 11.5 + Math.random() * 8.5,
				angle: Math.random() * Math.PI * 2,
				height: (Math.random() * 2 - 1) * 9,
				speed: 0.1 + Math.random() * 0.24,
				wobble: 0.6 + Math.random() * 1.6
			});
		}

		let viewportW = 1;
		let viewportH = 1;
		const resize = () => {
			if (!host) return;
			const rect = host.getBoundingClientRect();
			viewportW = Math.max(1, rect.width);
			viewportH = Math.max(1, rect.height);
			renderer.setSize(viewportW, viewportH, false);
			camera.aspect = viewportW / viewportH;
			camera.updateProjectionMatrix();
		};

		resize();

		let resizeObserver: ResizeObserver | null = null;
		const onWindowResize = () => resize();
		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(() => resize());
			resizeObserver.observe(host);
		} else {
			window.addEventListener('resize', onWindowResize);
		}

		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = media.matches;
		const onMotionChange = (event: MediaQueryListEvent) => {
			prefersReducedMotion = event.matches;
		};
		let removeMotionListener = () => {};
		if (typeof media.addEventListener === 'function') {
			media.addEventListener('change', onMotionChange);
			removeMotionListener = () => media.removeEventListener('change', onMotionChange);
		} else {
			media.addListener(onMotionChange);
			removeMotionListener = () => media.removeListener(onMotionChange);
		}

		let smoothProgress = rawProgress;
		let previousSmoothProgress = rawProgress;
		let raf = 0;

		const tempCamera = new THREE.Vector3();
		const tempLook = new THREE.Vector3();
		const tempSide = new THREE.Vector3();
		const projected = new THREE.Vector3();
		const lightAnchor = new THREE.Vector3();
		const footTangent = new THREE.Vector3();
		const footSide = new THREE.Vector3();
		const transitVec = new THREE.Vector3();
		const stackFrom = new THREE.Vector3();
		const stackTo = new THREE.Vector3();
		const stackDirection = new THREE.Vector3();
		const stackNormal = new THREE.Vector3();

		const animate = (now: number) => {
			const t = now * 0.001;

			if (prefersReducedMotion) {
				smoothProgress = rawProgress;
			} else {
				smoothProgress += (rawProgress - smoothProgress) * CAMERA_SMOOTHING;
			}

			const scrollVelocity = smoothProgress - previousSmoothProgress;
			previousSmoothProgress = smoothProgress;

			const { bestIndex, bestDistance } = findNearestStop(smoothProgress);
			const focus = smoothstep(1 - clamp(bestDistance / 0.072, 0, 1));

			const sparkVis = stopVisibility(smoothProgress, STOPS[0].progress, 0.22);
			const cityVis = stopVisibilityDirectional(smoothProgress, STOPS[1].progress, 0.15, 0.23);
			const stackVis = stopVisibility(smoothProgress, STOPS[2].progress, 0.23);
			const portalVis = stopVisibility(smoothProgress, STOPS[3].progress, 0.23);

			const travelT = lerp(0.03, 0.935, smoothProgress);
			const lookT = clamp(travelT + lerp(0.115, 0.045, focus), 0, 1);
			const pathPos = routeCurve.getPointAt(travelT);
			const lookPos = routeCurve.getPointAt(lookT);
			const tangent = routeCurve.getTangentAt(travelT);
			tempSide.set(-tangent.z, 0, tangent.x).normalize();

			const motionEnergy = clamp(Math.abs(scrollVelocity) * 260, 0, 1);
			const swayAmplitude = lerp(0.06, 1.0, motionEnergy) * (1 - focus * 0.72);
			const swayPrimary = Math.sin(t * 1.1 + smoothProgress * 12) * 0.74;
			const swaySecondary = Math.sin(t * 2.8 + smoothProgress * 27) * 0.23;
			const sway = (swayPrimary + swaySecondary) * swayAmplitude;
			swayIntensity = clamp(Math.abs(sway) / 1.1, 0, 1);

			tempCamera
				.copy(pathPos)
				.addScaledVector(tempSide, sway)
				.addScaledVector(tangent, lerp(-15.2, -8.0, focus))
				.add(new THREE.Vector3(0, lerp(16.0, 10.4, focus) + cityVis * 4.8, 0));

			if (prefersReducedMotion) {
				camera.position.copy(tempCamera);
			} else {
				camera.position.lerp(tempCamera, 0.12);
			}

			tempLook.copy(lookPos).add(new THREE.Vector3(0, lerp(3.6, 6.8, focus) + cityVis * 7.2, 0));
			camera.lookAt(tempLook);

			const targetFov = clamp(lerp(54, 42, focus) - cityVis * 4.6, 36, 60);
			camera.fov = prefersReducedMotion ? targetFov : lerp(camera.fov, targetFov, 0.14);
			camera.updateProjectionMatrix();

			cameraPhase = focus > 0.44 ? 'focus' : 'travel';
			activeStopIndex = bestIndex;
			cityProximity = portalVis;

			const cityBase = routeCurve.getPointAt(STOPS[3].along);
			cityGlowLight.position.set(cityBase.x, 76 + portalVis * 44, cityBase.z - 14);
			cityGlowLight.intensity = 4.8 + portalVis * 8.2;
			cityCrownLight.position.set(cityBase.x, 124 + portalVis * 44, cityBase.z - 20);
			cityCrownLight.intensity = 2.6 + portalVis * 6.3;

			routeCurve.getPointAt(clamp(travelT + 0.085, 0, 1), lightAnchor);
			routeCurve.getTangentAt(clamp(travelT + 0.085, 0, 1), footTangent);
			footSide.set(-footTangent.z, 0, footTangent.x).normalize();
			shardLightWarm.position.copy(lightAnchor).addScaledVector(footSide, 6.5).add(new THREE.Vector3(0, 2.8, 0));
			shardLightCool.position.copy(lightAnchor).addScaledVector(footSide, -5.6).add(new THREE.Vector3(0, 2.3, 0));
			shardLightWarm.intensity = 3.1 + motionEnergy * 1.9 + portalVis * 1.15;
			shardLightCool.intensity = 1.7 + motionEnergy * 1 + portalVis * 0.65;
			pathGuideMaterial.opacity = 0.16 + portalVis * 0.3 + motionEnergy * 0.12;
			pathGuideGlowMaterial.opacity = 0.08 + portalVis * 0.22 + motionEnergy * 0.1;

			sparkGroup.visible = sparkVis > 0.01;
			sparkGroup.scale.setScalar(0.76 + sparkVis * 0.4);

			// Archive Core — render 2D canvas and update texture
			if (sparkVis > 0.01) {
				sparkRenderer.render(now);
				sparkTexture.needsUpdate = true;
				sparkBillboard.lookAt(camera.position);
				const sparkMat = sparkBillboard.material;
				if (sparkMat instanceof THREE.MeshBasicMaterial) {
					sparkMat.opacity = sparkVis;
				}
			}

			citySceneGroup.visible = cityVis > 0.01;
			citySceneGroup.scale.setScalar(0.76 + cityVis * 0.4);
			cityBasePlate.rotation.y += 0.0016 + cityVis * 0.0014;
			for (const tower of cityTowers) {
				tower.mesh.scale.y = tower.baseHeight * (0.24 + cityVis * 0.86);
				tower.mesh.position.y = tower.mesh.scale.y * 0.5 - 0.8;
				const material = tower.mesh.material;
				if (material instanceof THREE.MeshStandardMaterial) {
					material.emissiveIntensity =
						tower.glow * (0.5 + cityVis * 1.25) * (0.82 + Math.sin(t * 2.3 + tower.phase) * 0.24);
				}
			}

			for (const flight of transitFlights) {
				const phase = (t * flight.speed + flight.phase) % 1;
				transitVec.lerpVectors(flight.from, flight.to, phase);
				transitVec.y += Math.sin(phase * Math.PI) * flight.arc;
				flight.mesh.position.copy(transitVec);
				const material = flight.mesh.material;
				if (material instanceof THREE.MeshBasicMaterial) {
					material.opacity = cityVis * 0.95;
				}
			}

			// City ground glisten — sharp staggered flash cycles
			const glColorsArray = glistenGeometry.attributes.color.array as Float32Array;
			for (let i = 0; i < glistenSeeds.length; i += 1) {
				const gs = glistenSeeds[i];
				const cycle = ((t * gs.speed + gs.phase) % (Math.PI * 2)) / (Math.PI * 2);
				let intensity: number;
				if (cycle < gs.duration) {
					const local = cycle / gs.duration;
					intensity = local < 0.2 ? local / 0.2 : Math.pow(1 - (local - 0.2) / 0.8, 1.5);
				} else {
					intensity = 0;
				}
				const base = 0.06 + Math.sin(t * 0.1 + gs.phase * 3) * 0.04;
				const bright = (base + intensity * (1 - base)) * cityVis;
				glColorsArray[i * 3] = gs.baseR * bright;
				glColorsArray[i * 3 + 1] = gs.baseG * bright;
				glColorsArray[i * 3 + 2] = gs.baseB * bright;
			}
			glistenGeometry.attributes.color.needsUpdate = true;

			stackGroup.visible = stackVis > 0.01;
			stackGroup.scale.setScalar(0.78 + stackVis * 0.44);
			stackBasePlate.rotation.y += 0.001 + stackVis * 0.001;
			const stackLineMaterial = stackConnections.material;
			if (stackLineMaterial instanceof THREE.LineBasicMaterial) {
				stackLineMaterial.opacity = 0.08 + stackVis * 0.8;
			}
			for (const node of stackNodes) {
				node.mesh.rotation.y += 0.004;
				node.mesh.rotation.x += 0.002;
				node.mesh.position.y = node.baseY + Math.sin(t * 1.2 + node.phase) * 0.58;
				node.logo.position.y = node.mesh.position.y + 1.9;
				node.logo.lookAt(camera.position);
				const nodeMaterial = node.mesh.material;
				if (nodeMaterial instanceof THREE.MeshStandardMaterial) {
					nodeMaterial.emissiveIntensity = 0.24 + stackVis * 1.35 + Math.sin(t * 2.2 + node.phase) * 0.14;
				}
				const logoMaterial = node.logo.material;
				if (logoMaterial instanceof THREE.MeshBasicMaterial) {
					logoMaterial.opacity = 0.22 + stackVis * 0.78;
				}
			}
			for (const container of stackContainers) {
				container.mesh.position.y = container.baseY + Math.sin(t * 1.25 + container.phase) * 0.18;
				container.mesh.rotation.y += 0.0012 + Math.sin(t * 0.6 + container.phase) * 0.0003;
				const material = container.mesh.material;
				if (material instanceof THREE.MeshStandardMaterial) {
					material.emissiveIntensity =
						container.glow * (0.44 + stackVis * 1.5) * (0.8 + Math.sin(t * 1.8 + container.phase) * 0.2);
				}
			}
			stackHubCore.rotation.y += 0.0034;
			stackHubCore.rotation.x = Math.sin(t * 0.9) * 0.05;
			const stackHubCoreMaterial = stackHubCore.material;
			if (stackHubCoreMaterial instanceof THREE.MeshStandardMaterial) {
				stackHubCoreMaterial.emissiveIntensity = 0.32 + stackVis * 1.64 + Math.sin(t * 2.4) * 0.1;
			}
			cafeGlow.intensity = 0.75 + stackVis * 3.2 + Math.sin(t * 2.4) * 0.3;
			for (const message of stackMessages) {
				const node = stackNodes[message.nodeIndex];
				if (!node) continue;
				stackFrom.copy(node.mesh.position);
				stackTo.copy(stackHubCenter);
				const routePhase = (t * message.speed + message.phase) % 1;
				const travel = message.outbound ? routePhase : 1 - routePhase;
				transitVec.lerpVectors(stackFrom, stackTo, travel);
				stackDirection.subVectors(stackTo, stackFrom).normalize();
				stackNormal.set(-stackDirection.z, 0, stackDirection.x).normalize();
				transitVec.addScaledVector(stackNormal, message.lane);
				transitVec.y += Math.sin(travel * Math.PI) * (message.lift + stackVis * 1.35);
				message.mesh.position.copy(transitVec);
				const material = message.mesh.material;
				if (material instanceof THREE.MeshBasicMaterial) {
					material.opacity = stackVis * (0.34 + Math.max(0, Math.sin(t * 4 + message.phase)) * 0.62);
				}
			}

			portalGroup.visible = portalVis > 0.01;
			portalGroup.scale.setScalar(0.78 + portalVis * 0.56);
			portalRing.rotation.z += 0.002;
			portalRing.rotation.y += 0.0014;
			portalRingMaterial.emissiveIntensity = 0.9 + portalVis * 2.2;
			const apertureMaterial = portalAperture.material;
			if (apertureMaterial instanceof THREE.MeshBasicMaterial) {
				apertureMaterial.opacity = 0.35 + portalVis * 0.6;
			}
			const innerGlowMaterial = portalInnerGlow.material;
			if (innerGlowMaterial instanceof THREE.MeshBasicMaterial) {
				innerGlowMaterial.opacity = 0.08 + portalVis * 0.35;
			}
			portalLight.intensity = 0.8 + portalVis * 6.2;
			for (const shard of portalShards) {
				shard.angle += shard.speed * (0.018 + portalVis * 0.018);
				const radius = shard.radius + Math.sin(t * shard.wobble + shard.angle) * 1.2;
				shard.mesh.position.set(
					Math.cos(shard.angle) * radius,
					shard.height + Math.sin(t * 1.8 + shard.angle) * 0.8,
					Math.sin(shard.angle) * radius * 0.24
				);
				shard.mesh.rotation.set(Math.sin(t + shard.angle), Math.cos(t * 0.6 + shard.angle), shard.angle);
				const material = shard.mesh.material;
				if (material instanceof THREE.MeshBasicMaterial) {
					material.opacity = 0.04 + portalVis * 0.28;
				}
			}

			const nextProjection: StopProjection[] = STOPS.map((stop) => ({
				id: stop.id,
				x: 0,
				y: 0,
				opacity: 0,
				scale: 0.86,
				side: stop.side
			}));

			for (let i = 0; i < STOPS.length; i += 1) {
				const stop = STOPS[i];
				const marker = stopMarkers[i];
				const visibility =
					stop.id === 'city'
						? stopVisibilityDirectional(smoothProgress, stop.progress, 0.15, 0.22)
						: stopVisibility(smoothProgress, stop.progress, 0.22);
				const isActive = i === bestIndex;
				const pulse = 0.9 + Math.sin(t * 4.1 + i * 1.8) * 0.1;

				marker.core.scale.setScalar(0.75 + visibility * 0.86 * pulse * (isActive ? 1.1 : 1));
				const coreMaterial = marker.core.material;
				if (coreMaterial instanceof THREE.MeshStandardMaterial) {
					coreMaterial.emissiveIntensity = 0.24 + visibility * (isActive ? 1.45 : 0.84);
				}

				marker.ring.scale.setScalar(1 + visibility * (isActive ? 0.95 : 0.48));
				const ringMaterial = marker.ring.material;
				if (ringMaterial instanceof THREE.MeshBasicMaterial) {
					ringMaterial.opacity = 0.08 + visibility * (isActive ? 0.52 : 0.28);
				}

				marker.ambient.position.copy(marker.anchor).add(new THREE.Vector3(0, 3 + visibility * 2.6, 0));
				marker.ambient.intensity = 1.4 + visibility * (isActive ? 7.6 : 4.3);
				marker.ambient.distance = 210 + visibility * (isActive ? 270 : 180);

				const haloMaterial = marker.halo.material;
				if (haloMaterial instanceof THREE.MeshBasicMaterial) {
					haloMaterial.opacity = 0.05 + visibility * (isActive ? 0.22 : 0.13);
				}
				marker.halo.position.copy(marker.anchor).add(new THREE.Vector3(0, 2.2 + visibility * 2.0, 0));
				marker.halo.scale.setScalar(0.85 + visibility * (isActive ? 3.25 : 2.2));

				projected.copy(marker.anchor);
				projected.y += 8 + visibility * 12;
				projected.project(camera);
				const inFront = projected.z > -1 && projected.z < 1;
				if (!inFront || visibility < 0.01) continue;

				const screenX = (projected.x * 0.5 + 0.5) * viewportW;
				const screenY = (-projected.y * 0.5 + 0.5) * viewportH;
				nextProjection[i] = {
					id: stop.id,
					x: clamp(screenX, 150, viewportW - 150),
					y: clamp(screenY, 140, viewportH - 80),
					opacity: visibility * (isActive ? 1 : 0.68),
					scale: 0.88 + visibility * 0.2 + (isActive ? 0.06 : 0),
					side: stop.side
				};
			}

			projectedStops = nextProjection;
			shardMaterial.emissiveIntensity = 0.44 + motionEnergy * 0.24 + portalVis * 0.22;

			const dustMaterial = dust.material;
			if (dustMaterial instanceof THREE.PointsMaterial) {
				dustMaterial.opacity = 0.24 + portalVis * 0.3;
			}

			renderer.render(scene, camera);
			raf = requestAnimationFrame(animate);
		};

		raf = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(raf);
			resizeObserver?.disconnect();
			window.removeEventListener('resize', onWindowResize);
			removeMotionListener();

			const geometries = new Set<THREE.BufferGeometry>();
			const materials = new Set<THREE.Material>();
			scene.traverse((obj) => {
				const mesh = obj as THREE.Mesh;
				if (!mesh.isMesh) return;
				geometries.add(mesh.geometry);
				const material = mesh.material;
				if (Array.isArray(material)) {
					for (const mat of material) materials.add(mat);
				} else {
					materials.add(material);
				}
			});
			for (const geometry of geometries) geometry.dispose();
			for (const material of materials) material.dispose();
			pathGuide.geometry.dispose();
			pathGuideMaterial.dispose();
			solanaTexture.dispose();
			chicagoTexture.dispose();
			renderer.dispose();
			host?.removeChild(renderer.domElement);
		};
	});
</script>

<svelte:window bind:scrollY bind:innerWidth bind:innerHeight />

<div class="nc3-scroll" style="height: {virtualHeight}px">
	<div class="nc3-stage" bind:this={host}></div>
	<div class="nc3-noise"></div>
	<div class="nc3-vignette"></div>

	<div class="nc3-hud hud-left">
		<div class="hud-kicker">Null City // Route</div>
		{#if hudStopVisible}
			<div class="hud-title">{activeStop.title}</div>
			<div class="hud-meta">{activeStop.detail}</div>
		{/if}
	</div>

	<div class="nc3-hud hud-right">
		<div class="hud-metric"><span>Portal Proximity</span><strong>{Math.round(cityProximity * 100)}%</strong></div>
		<div class="hud-metric"><span>Camera Phase</span><strong>{cameraPhase}</strong></div>
		<div class="hud-metric"><span>Sway</span><strong>{(swayIntensity * 100).toFixed(1)}</strong></div>
	</div>

	{#if heroOpacity > 0.01}
		<div class="intro" style="opacity: {heroOpacity}">
			<div class="intro-overline">An Onion DAO Production</div>
			<h1>Null City</h1>
			<p class="intro-subtext"><em>the beginning of something</em></p>
		</div>
	{/if}

	{#if isMobile}
		{#if hudStopVisible || showPostPortalPanel}
			{#if showPostPortalPanel}
				<article class="mobile-stop mobile-stop--portal" style="--stop-color: {STOPS[3].color}; opacity: {postPortalReveal}">
					<div class="portal-panel__title">Portal Connections</div>
					<div class="portal-panel__links">
						<a href="https://x.com/oniondao_" target="_blank" rel="noopener noreferrer" aria-label="Onion DAO on X"><Twitter size={16} /></a>
						<a href="https://x.com/nullcityai" target="_blank" rel="noopener noreferrer" aria-label="Null City on X"><Twitter size={16} /></a>
						<a href="https://www.instagram.com/onion.dao" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={16} /></a>
						<a href="https://github.com/OnionDAO-git" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github size={16} /></a>
						<a href="mailto:team@oniondao.dev" aria-label="Email"><Mail size={16} /></a>
					</div>
					<div class="portal-panel__mark">Onion DAO &middot; Chicago</div>
				</article>
			{:else}
				<article class="mobile-stop" style="--stop-color: {activeStop.color}">
					<h2>{activeStop.title}</h2>
					<p>{activeStop.body}</p>
					<ul>
						{#each activeStop.highlights.slice(0, 3) as highlight (highlight)}
							<li>{highlight}</li>
						{/each}
					</ul>
					<a class="stop-link" href={activeStop.wikiHref}>Read wiki page</a>
				</article>
			{/if}
		{/if}
	{:else}
		<div class="stop-layer">
			{#each projectedStops as projection, index (projection.id)}
				{@const stop = STOPS[index]}
				{#if projection.opacity > 0.05}
					<article
						class="stop-card"
						class:left={projection.side === 'left'}
						class:right={projection.side === 'right'}
						class:active={index === activeStopIndex}
						style="
							--stop-color: {stop.color};
							left: {projection.x}px;
							top: {projection.y}px;
							opacity: {projection.opacity};
							transform: translate(-50%, -100%) scale({projection.scale});
						"
						>
							<h2>{stop.title}</h2>
							<p>{stop.body}</p>
							<ul>
								{#each stop.highlights as highlight (highlight)}
									<li>{highlight}</li>
								{/each}
							</ul>
							<a class="stop-link" href={stop.wikiHref}>Read wiki page</a>
						</article>
					{/if}
				{/each}
		</div>

		{#if showPostPortalPanel}
			<aside
				class="portal-panel"
				style="
					--stop-color: {STOPS[3].color};
					opacity: {postPortalReveal};
					transform: translate(-50%, -50%) scale({0.95 + postPortalReveal * 0.05});
				"
			>
				<div class="portal-panel__title">Portal Connections</div>
				<div class="portal-panel__links">
					<a href="https://x.com/oniondao_" target="_blank" rel="noopener noreferrer" aria-label="Onion DAO on X"><Twitter size={16} /></a>
					<a href="https://x.com/nullcityai" target="_blank" rel="noopener noreferrer" aria-label="Null City on X"><Twitter size={16} /></a>
					<a href="https://www.instagram.com/onion.dao" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={16} /></a>
					<a href="https://github.com/OnionDAO-git" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github size={16} /></a>
					<a href="mailto:team@oniondao.dev" aria-label="Email"><Mail size={16} /></a>
				</div>
				<div class="portal-panel__mark">Onion DAO &middot; Chicago</div>
			</aside>
		{/if}
	{/if}
</div>

<style>
	.nc3-scroll {
		position: relative;
		width: 100%;
		--nc3-header-offset: var(--brand-toggle-height, 45px);
		--void: #0e0c0a;
		--crypt: #161310;
		--nave: #1e1a16;
		--chapel: #28231e;
		--alcove: #342d26;
		--worn: #443b30;
		--weathered: #5c5040;
		--chalk: #ede8e0;
		--chalk2: #d4cdb8;
		--chalk3: #b0a690;
		--chalk4: #8a7e6a;
	}

	.nc3-stage,
	.nc3-noise,
	.nc3-vignette,
	.stop-layer,
	.nc3-hud,
	.intro,
	.mobile-stop {
		position: fixed;
	}

	.nc3-stage,
	.nc3-noise,
	.nc3-vignette,
	.stop-layer {
		top: var(--nc3-header-offset);
		right: 0;
		bottom: 0;
		left: 0;
	}

	.nc3-stage {
		z-index: 0;
		overflow: hidden;
	}

	.nc3-stage :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}

	.nc3-noise {
		z-index: 1;
		pointer-events: none;
		background:
			repeating-linear-gradient(
				0deg,
				rgba(255, 255, 255, 0.005) 0 1px,
				transparent 1px 6px
			),
			repeating-linear-gradient(
				90deg,
				rgba(176, 166, 144, 0.006) 0 1px,
				transparent 1px 9px
			);
		mix-blend-mode: screen;
	}

	.nc3-vignette {
		z-index: 2;
		pointer-events: none;
		background:
			radial-gradient(
				ellipse at 50% 42%,
				rgba(14, 12, 10, 0) 0%,
				rgba(22, 19, 16, 0.12) 54%,
				rgba(14, 12, 10, 0.38) 100%
			),
			linear-gradient(to bottom, rgba(240, 184, 76, 0.05), rgba(14, 12, 10, 0.22));
	}

	.nc3-hud {
		z-index: 5;
		pointer-events: none;
		font-family: var(--mono);
		text-transform: uppercase;
	}

	.hud-left {
		top: calc(var(--nc3-header-offset) + clamp(20px, 4vw, 44px));
		left: clamp(20px, 3vw, 44px);
		max-width: min(42rem, 58vw);
	}

	.hud-right {
		top: calc(var(--nc3-header-offset) + clamp(20px, 4vw, 44px));
		right: clamp(20px, 3vw, 44px);
		display: grid;
		gap: 8px;
		justify-items: end;
	}

	.hud-kicker {
		font-size: 10px;
		letter-spacing: 5px;
		color: color-mix(in srgb, var(--chalk3) 80%, transparent);
	}

	.hud-title {
		margin-top: 7px;
		font-family: var(--serif);
		font-size: clamp(2rem, 4.6vw, 4.8rem);
		line-height: 0.92;
		letter-spacing: -0.04em;
		color: var(--chalk);
		text-transform: none;
		text-wrap: balance;
	}

	.hud-meta {
		margin-top: 11px;
		font-size: 10px;
		letter-spacing: 3px;
		color: color-mix(in srgb, var(--chalk4) 90%, transparent);
	}

	.hud-metric {
		display: flex;
		gap: 10px;
		align-items: baseline;
		font-size: 10px;
		letter-spacing: 2.2px;
		color: color-mix(in srgb, var(--chalk3) 85%, transparent);
	}

	.hud-metric strong {
		font-size: 11px;
		color: #f0b84c;
	}

	.intro {
		z-index: 4;
		inset: var(--nc3-header-offset) 0 0 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		pointer-events: none;
		padding: clamp(16px, 3vw, 32px);
	}

	.intro-overline {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 5px;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--chalk3) 82%, transparent);
	}

	.intro h1 {
		margin: 16px 0 0;
		font-family: var(--serif);
		font-size: clamp(3rem, 8vw, 7.8rem);
		line-height: 0.9;
		color: var(--chalk);
		letter-spacing: -0.06em;
		text-transform: none;
	}

	.intro-subtext {
		margin: 2px 0 0;
		font-family: var(--serif);
		font-size: clamp(1rem, 2.1vw, 1.4rem);
		line-height: 1.2;
		letter-spacing: 0.01em;
		color: color-mix(in srgb, var(--chalk2) 88%, transparent);
	}

	.stop-layer {
		z-index: 6;
		pointer-events: none;
	}

	.stop-card {
		position: absolute;
		width: min(40ch, 35vw);
		padding: 1rem 1.1rem 1.08rem;
		border: 1px solid color-mix(in srgb, var(--stop-color) 48%, transparent);
		background: linear-gradient(
			168deg,
			color-mix(in srgb, var(--stop-color) 9%, var(--nave)) 0%,
			color-mix(in srgb, var(--void) 78%, var(--crypt)) 100%
		);
		box-shadow:
			0 24px 48px rgba(0, 0, 0, 0.42),
			0 0 24px color-mix(in srgb, var(--stop-color) 22%, transparent);
		border-radius: 10px;
		backdrop-filter: blur(6px);
		pointer-events: auto;
		transform-origin: center bottom;
		transition: opacity 220ms ease;
	}

	.stop-card.left {
		margin-left: -10vw;
	}

	.stop-card.right {
		margin-left: 10vw;
	}

	.stop-card.active {
		box-shadow:
			0 30px 56px rgba(0, 0, 0, 0.52),
			0 0 30px color-mix(in srgb, var(--stop-color) 32%, transparent);
	}

	.stop-card h2,
	.mobile-stop h2 {
		margin-top: 2px;
		font-family: var(--serif);
		font-size: clamp(1.2rem, 1.8vw, 1.95rem);
		line-height: 1;
		color: var(--chalk);
		letter-spacing: -0.03em;
		text-wrap: balance;
	}

	.stop-card p,
	.mobile-stop p {
		margin-top: 10px;
		font-family: var(--sans);
		font-size: 0.92rem;
		line-height: 1.5;
		color: color-mix(in srgb, var(--chalk2) 92%, #3d94c4 8%);
	}

	.stop-card ul,
	.mobile-stop ul {
		margin-top: 12px;
		padding-left: 17px;
		display: grid;
		gap: 6px;
	}

	.stop-card li,
	.mobile-stop li {
		font-family: var(--sans);
		font-size: 0.84rem;
		line-height: 1.4;
		color: color-mix(in srgb, var(--chalk3) 90%, #3d94c4 10%);
	}

	.stop-link {
		margin-top: 12px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--stop-color) 70%, var(--chalk2));
		text-decoration: none;
		border-bottom: 1px solid color-mix(in srgb, var(--stop-color) 42%, transparent);
		padding-bottom: 2px;
	}

	.stop-link:hover {
		color: var(--chalk);
		border-bottom-color: color-mix(in srgb, var(--stop-color) 66%, transparent);
	}

	.mobile-stop {
		z-index: 7;
		left: 12px;
		right: 12px;
		bottom: max(12px, env(safe-area-inset-bottom));
		padding: 0.9rem 0.95rem 1rem;
		border-radius: 12px;
		border: 1px solid color-mix(in srgb, var(--stop-color) 42%, transparent);
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--stop-color) 10%, var(--nave)) 0%,
			color-mix(in srgb, var(--void) 78%, var(--crypt)) 100%
		);
		box-shadow:
			0 18px 36px rgba(0, 0, 0, 0.52),
			0 0 24px color-mix(in srgb, var(--stop-color) 28%, transparent);
		pointer-events: auto;
		max-height: min(45svh, 360px);
		overflow: auto;
	}

	.portal-panel {
		position: fixed;
		z-index: 8;
		left: 50%;
		top: calc(var(--nc3-header-offset) + (100vh - var(--nc3-header-offset)) * 0.5);
		bottom: auto;
		width: min(62rem, calc(100vw - 36px));
		padding: 1.7rem 1.9rem 1.8rem;
		min-height: 11rem;
		border-radius: 12px;
		border: 1px solid color-mix(in srgb, var(--stop-color) 42%, transparent);
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--stop-color) 12%, var(--nave)) 0%,
			color-mix(in srgb, var(--void) 80%, var(--crypt)) 100%
		);
		box-shadow:
			0 18px 36px rgba(0, 0, 0, 0.48),
			0 0 24px color-mix(in srgb, var(--stop-color) 28%, transparent);
		backdrop-filter: blur(8px);
		pointer-events: auto;
		display: grid;
		gap: 1.24rem;
		align-content: center;
		justify-items: center;
		transform-origin: center center;
		transition: opacity 220ms ease, transform 220ms ease;
	}

	.portal-panel__title {
		font-family: var(--mono);
		font-size: 20px;
		letter-spacing: 6px;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--chalk3) 90%, transparent);
	}

	.portal-panel__links {
		display: flex;
		justify-content: center;
		gap: 0.52rem;
		flex-wrap: wrap;
	}

	.portal-panel__links a {
		width: 4rem;
		height: 4rem;
		display: inline-grid;
		place-items: center;
		color: color-mix(in srgb, var(--chalk2) 92%, transparent);
		border: 1px solid color-mix(in srgb, var(--stop-color) 28%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--void) 72%, transparent);
		transition: color 200ms ease, border-color 200ms ease, background-color 200ms ease;
	}

	.portal-panel__links a :global(svg) {
		width: 2rem;
		height: 2rem;
	}

	.portal-panel__links a:hover {
		color: var(--chalk);
		border-color: color-mix(in srgb, var(--stop-color) 56%, transparent);
		background: color-mix(in srgb, var(--stop-color) 14%, var(--void));
	}

	.portal-panel__mark {
		font-family: var(--mono);
		font-size: 20px;
		letter-spacing: 6px;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--chalk4) 92%, transparent);
	}

	.mobile-stop--portal {
		left: 50%;
		right: auto;
		top: calc(var(--nc3-header-offset) + (100vh - var(--nc3-header-offset)) * 0.5);
		bottom: auto;
		width: min(62rem, calc(100vw - 24px));
		min-height: 11rem;
		transform: translate(-50%, -50%);
		text-align: center;
		max-height: none;
	}

	@media (max-width: 960px) {
		.hud-right,
		.stop-layer {
			display: none;
		}

		.hud-left {
			max-width: 90vw;
			top: calc(var(--nc3-header-offset) + 16px);
			left: 14px;
		}

		.hud-title {
			font-size: clamp(1.45rem, 7vw, 2.2rem);
		}

		.hud-meta {
			font-size: 8px;
			letter-spacing: 2px;
		}

		.intro {
			align-items: start;
			padding-top: clamp(6rem, 16vh, 9rem);
		}

		.intro h1 {
			font-size: clamp(2.6rem, 12vw, 4.2rem);
		}

		.portal-panel {
			display: none;
		}
	}

	@media (max-width: 520px) {
		.mobile-stop h2 {
			font-size: 1.22rem;
		}

		.mobile-stop p {
			font-size: 0.84rem;
		}

		.mobile-stop li {
			font-size: 0.77rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stop-card,
		.mobile-stop,
		.portal-panel {
			transition: none;
		}
	}
</style>
