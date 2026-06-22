// Avatar: Fogo e Cinzas — TRAILER COMPLETO (78 shots).
// Fonte única: gera as imagens (flux2-klein), escreve o movie spec YAML e o timeline.json.
// Uso: node build.mjs            (gera tudo)
//      node build.mjs --no-img   (só reescreve yaml/timeline, sem gerar imagem)
import { generateImage } from '/home/nmaldaner/.claude/skills/pixflow-motion/cli/genimg.mjs';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(ROOT, 'assets');
mkdirSync(ASSETS, { recursive: true });
const NOIMG = process.argv.includes('--no-img');

const STYLE = 'cinematic, hyperrealistic, vibrant colors, bioluminescent details, epic alien fantasy, ' +
  'high detail, dramatic volumetric lighting, film grain, shallow depth of field, ' +
  'clear separation between foreground / midground / deep background for parallax';

// helper p/ câmera compacta
const C = (type, o = {}) => ({ type, ...o });
const CAP = (body, accent = '#f2efe6') => ({ body, position: 'bottom', align: 'center', accent });
const TITLE = (title, kicker, accent = '#ff6a1a') => ({ title, kicker, position: 'center', align: 'center', accent });

// kind: 'img' (gera), 'ember'/'black'/'white' (bg sintético), reuse: id de outro shot
const SHOTS = [
  // ---------- 1. TEASER (0:00-0:07) ----------
  // ENTRADA: cartela de texto (disclaimer) + teaser (abertura lenta, versão anterior)
  { id: 's00', kind: 'black', cam: C('push_in', { intensity: 0.4 }), look: 'noir-film', dur: 2.6, cap: { title: 'AVATAR', body: 'trailer simulando Avatar com imagens', position: 'center', align: 'center', accent: '#ffb347' }, tout: { type: 'dip_to_black', duration: 0.4 } },
  { id: 's01', prompt: 'majestic floating rocky islands over a turquoise alien ocean, two huge organic bioluminescent airship-creatures like glowing jellyfish hovering, lush jungle, waterfalls, dawn light, wide aerial establishing, vast scale', cam: C('aerial', { intensity: 1.1, amplitude: 'dramatico', easing: 'ease_out' }), look: 'sonho-etereo', dur: 1.7, tout: { type: 'cut' } },
  { id: 's02', prompt: 'extreme close-up portrait of a young female blue-skinned alien humanoid, large amber eyes, subtle bioluminescent dots, worried expression, dark bioluminescent jungle bokeh, a glowing jellyfish-plant beside her', cam: C('push_in', { intensity: 0.8, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 1.5, tout: { type: 'cut' } },
  { id: 's03', prompt: 'a tall imposing female blue-skinned alien chieftain, red tribal markings, elaborate red and black feather headdress, standing in a dark cave entrance extending one arm, rim light, full body, smoke', cam: C('crane', { intensity: 1.0 }), look: 'cinema-dramatico', dur: 1.5, tout: { type: 'cut' } },
  { id: 's04', prompt: 'a fierce male blue-skinned alien warrior with red markings drawing a bow, aiming intensely, other blurred warriors behind, jungle, tense', cam: C('crash_zoom', { intensity: 0.9 }), look: 'acao-epico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's05', prompt: 'two heroic blue-skinned alien figures standing side by side looking ahead, several large winged flying creatures in a bright clear sky behind them, new dawn', cam: C('static', { breath: 0.6 }), look: 'acao-epico', dur: 1.4, tout: { type: 'cut' } },
  { id: 's06', kind: 'ember', cam: C('push_in', { intensity: 0.5 }), look: 'acao-epico', dur: 2.3, cap: TITLE('FOGO E CINZAS', 'AVATAR — Trailer Oficial'), tout: { type: 'dip_to_black', duration: 0.4 } },
  { id: 's07', kind: 'black', cam: C('static', { breath: 0 }), look: 'noir-film', dur: 0.6, tout: { type: 'cut' } },

  // ---------- 2. MUNDO / MARAVILHA (0:08-0:41) ----------
  { id: 's08', prompt: 'a blue-skinned alien rider on a large winged flying creature soaring between massive floating mountains with lush vegetation, giant waterfall behind, dynamic flight, foreground creature, deep hazy background', cam: C('tracking', { direction: 'right', intensity: 1.3, amplitude: 'dramatico' }), look: 'sonho-etereo', dur: 4.0, tout: { type: 'crossfade', duration: 0.6 } },
  { id: 's09', prompt: 'underwater scene, a blue-skinned alien riding a giant manta-ray-like creature gliding near a massive sunken alien structure, small fish, god rays from above, serene', cam: C('orbit', { intensity: 0.9 }), look: 'sci-fi-cyberpunk', dur: 4.2, tout: { type: 'crossfade', duration: 0.6 } },
  { id: 's10', reuse: 's02', cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.4, tout: { type: 'crossfade', duration: 0.5 } },
  { id: 's11', prompt: 'two blue-skinned alien figures, male and female, on a sandy beach at night under a huge glowing moon, the male holding a glowing staff, bioluminescent plants dotting the ground, intimate magical', cam: C('dolly', { direction: 'right', intensity: 1.0 }), look: 'sonho-etereo', dur: 3.8, tout: { type: 'crossfade', duration: 0.6 } },
  { id: 's12', prompt: 'a thoughtful young male blue-skinned alien with dreadlocks and green eyes looking down pensively, soft light, emotional, dark background', cam: C('static', { breath: 0.6 }), look: 'cinema-dramatico', dur: 3.6, cap: CAP('A força dos ancestrais está aqui.'), tout: { type: 'cut' } },
  { id: 's13', kind: 'black', cam: C('push_in', { intensity: 0.4 }), look: 'noir-film', dur: 2.0, cap: TITLE('DIREÇÃO DE IA', '', '#cfd6df'), tout: { type: 'dip_to_black', duration: 0.4 } },
  { id: 's14', prompt: 'multiple huge organic bioluminescent flying vessels over lush green islands and turquoise water, camera approaching the underside of one vessel, intricate organic structures, majestic', cam: C('aerial', { intensity: 1.0 }), look: 'sonho-etereo', dur: 3.0, tout: { type: 'crossfade', duration: 0.6 } },
  { id: 's15', prompt: 'a large purple bioluminescent jellyfish-like flying creature with smaller ones around it, flying over lush green islands and turquoise water, sense of scale, vibrant', cam: C('crane', { intensity: 1.0 }), look: 'sonho-etereo', dur: 2.0, tout: { type: 'cut' } },
  { id: 's16', prompt: 'a massive erupting volcano spewing lava and ash, dark clouds, a lone tiny figure with a backpack walking on a gray rocky path in the foreground, ominous epic scale', cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'acao-epico', dur: 3.0, tout: { type: 'cut' } },
  { id: 's17', prompt: 'a vast desolate gray volcanic wasteland with strange jagged rock formations, a small group of tiny figures walking in the distance, birds in a cloudy sky, emphasizing vastness', cam: C('crane', { intensity: 1.2, amplitude: 'dramatico' }), look: 'acao-epico', dur: 2.2, tout: { type: 'dip_to_black', duration: 0.4 } },
  { id: 's18', prompt: 'a group of blue-skinned alien figures moving stealthily through dense glowing bioluminescent jungle foliage and thick vines, light from the plants, mysterious', cam: C('dolly', { direction: 'down', intensity: 0.9 }), look: 'sonho-etereo', dur: 2.0, tout: { type: 'cut' } },
  { id: 's19', prompt: 'a blue-skinned alien character crawling through glowing bioluminescent undergrowth, glowing patterns on skin, stealth, urgency', cam: C('dolly', { intensity: 1.0 }), look: 'acao-epico', dur: 1.1, tout: { type: 'cut' } },

  // ---------- 3. PERSONAGENS / EMOÇÃO (0:41-1:09) ----------
  { id: 's20', prompt: 'extreme close-up of the eye of a giant blue whale-like creature with glowing patterns on its skin, partly submerged in water, detailed, emotional, serene', cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'sci-fi-cyberpunk', dur: 2.0, tout: { type: 'crossfade', duration: 0.5 } },
  { id: 's21', prompt: 'two blue-skinned alien figures on a wooden platform near the water interacting with a large blue creature and smaller creatures in the water, calm community life', cam: C('dolly', { direction: 'right', intensity: 1.0 }), look: 'sonho-etereo', dur: 2.0, tout: { type: 'cut' } },
  { id: 's22', prompt: 'a young alien-human hybrid teenager with dreadlocks and a breathing mask holding a knife, moving through dense green jungle, alert, ready for action, tense', cam: C('handheld', { intensity: 1.1 }), look: 'acao-epico', dur: 2.0, tout: { type: 'cut' } },
  { id: 's23', prompt: 'a blue-skinned alien couple sitting by the water at night under a huge moon, the male touching the female face, glowing patterns on their skin, intimate romantic', cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'sonho-etereo', dur: 2.0, tout: { type: 'crossfade', duration: 0.5 } },
  { id: 's24', prompt: 'close-up of a female blue-skinned alien face with glowing patterns looking up and smiling softly, hopeful tender, moonlight, beautiful', cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.0, tout: { type: 'cut' } },
  { id: 's25', prompt: 'close-up of a male blue-skinned alien face with glowing patterns looking down with a serious thoughtful expression, dramatic light', cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 1.5, tout: { type: 'cut' } },
  { id: 's26', prompt: 'a young blue-skinned alien walking away from camera on a wooden bridge over glowing bioluminescent water, calm reflective, magical', cam: C('dolly', { direction: 'left', intensity: 1.0 }), look: 'sonho-etereo', dur: 2.0, tout: { type: 'crossfade', duration: 0.5 } },
  { id: 's27', prompt: 'close-up of a male blue-skinned alien face with glowing patterns staring intensely off-screen, expressing anger and frustration, dramatic confrontational lighting', cam: C('push_in', { intensity: 1.0 }), look: 'cinema-dramatico', dur: 3.8, cap: CAP('Você não pode viver assim, nesse ódio!'), tout: { type: 'cut' } },
  { id: 's28', prompt: 'close-up of a female blue-skinned alien face with glowing patterns listening, looking pensive and worried, soft expression', cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 1.5, tout: { type: 'cut' } },

  // ---------- 4. APOSTAS / DESTRUIÇÃO (1:09-1:34) ----------
  { id: 's29', kind: 'black', cam: C('static', { breath: 0 }), look: 'noir-film', dur: 1.8, cap: TITLE('EM DEZEMBRO', '', '#cfd6df'), tout: { type: 'dip_to_black', duration: 0.4 } },
  { id: 's30', prompt: 'a blue-skinned alien walking away from camera on an arid dusty path carrying a bag, raising his arms in a gesture of freedom, desolate landscape with flying creatures behind, hope determination', cam: C('tracking', { direction: 'right', intensity: 1.1 }), look: 'acao-epico', dur: 2.5, tout: { type: 'cut' } },
  { id: 's31', prompt: 'close-up of a male blue-skinned alien face looking serious and determined, dramatic light', cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 1.5, tout: { type: 'cut' } },
  { id: 's32', prompt: 'a male blue-skinned alien embracing and comforting a distressed teenage alien-human hybrid, tender emotional moment, soft light', cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 1.5, tout: { type: 'cut' } },
  { id: 's33', prompt: 'close-up of a female blue-skinned alien face with intricate patterns looking determined and serious, resolute', cam: C('push_in', { intensity: 1.0 }), look: 'cinema-dramatico', dur: 2.0, cap: CAP('Se houver algo que possa ser feito,'), tout: { type: 'cut' } },
  { id: 's34', prompt: 'a blue-skinned alien running through a burning village, intense orange and red fire and smoke, other figures behind, chaos urgency action', cam: C('handheld', { intensity: 1.3, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's35', prompt: 'a blue-skinned alien warrior swinging a weapon in a chaotic brightly lit battle, bright blue and white energy light, surrounded by figures, combat chaos', cam: C('handheld', { intensity: 1.3, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's36', prompt: 'close-up of a female blue-skinned alien face looking fierce and determined, war intensity, resolute', cam: C('push_in', { intensity: 1.0 }), look: 'cinema-dramatico', dur: 2.0, cap: CAP('então é preciso fazer.'), tout: { type: 'cut' } },
  { id: 's37', prompt: 'close-up of a young blue-skinned alien face looking worried and slightly scared, vulnerable youthful innocence', cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 1.4, tout: { type: 'cut' } },
  { id: 's38', prompt: 'a sleek futuristic high-tech boat speeding across water, a huge industrial base structure behind it, technology threat, spray', cam: C('truck', { direction: 'right', intensity: 1.1 }), look: 'sci-fi-cyberpunk', dur: 1.5, tout: { type: 'cut' } },
  { id: 's39', prompt: 'close-up of a stern human-Navi hybrid soldier in military gear, blue skin with human features, glowing equipment elements, focused menacing', cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'acao-epico', dur: 1.5, tout: { type: 'cut' } },
  { id: 's40', prompt: 'close-up of a blue-skinned alien face looking serious and slightly sad, glowing patterns, intense eyes', cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's41', prompt: 'a fierce female blue-skinned alien warrior with red and white markings emerging aggressively from a dark cave-like structure, dynamic entrance, powerful', cam: C('handheld', { intensity: 1.1 }), look: 'acao-epico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's42', prompt: 'a powerful female blue-skinned alien leader standing with an elaborate red feather headdress and body paint, imposing regal, detail of costume', cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.0, tout: { type: 'cut' } },
  { id: 's43', prompt: 'a blue-skinned alien warrior with red and white markings aiming a bow, other warriors behind, ready for battle, fierce intense expression', cam: C('truck', { direction: 'left', intensity: 1.0 }), look: 'acao-epico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's44', prompt: 'a large group of blue-skinned alien warriors and human soldiers with mechs facing a huge aircraft in a desolate landscape, epic confrontation, imminent battle, scale', cam: C('crane', { intensity: 1.2, amplitude: 'dramatico' }), look: 'acao-epico', dur: 2.5, tout: { type: 'dip_to_black', duration: 0.4 } },

  // ---------- 5. CLÍMAX / BATALHA (1:34-2:15) ----------
  { id: 's45', prompt: 'close-up of alien hands holding fire and performing a ritual over a bowl, warm glowing firelight, spiritual mysterious', cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.0, tout: { type: 'cut' } },
  { id: 's46', prompt: 'fast blurred motion rushing through glowing bioluminescent jungle foliage, speed and chaos, disorientation', cam: C('whip_pan', { direction: 'right', intensity: 1.2 }), look: 'acao-epico', dur: 0.9, tout: { type: 'cut' } },
  { id: 's47', prompt: 'blue-skinned alien figures running and fighting in a bioluminescent jungle, one aiming a weapon, dynamic motion, glowing elements, action', cam: C('handheld', { intensity: 1.3, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's48', prompt: 'close-up of a female blue-skinned alien face with a breathing apparatus looking distressed and worried, dangerous environment', cam: C('push_in', { intensity: 1.0 }), look: 'cinema-dramatico', dur: 1.6, cap: CAP('As crianças!'), tout: { type: 'cut' } },
  { id: 's49', prompt: 'a female blue-skinned alien holding a child by the hand, running through thick green jungle foliage, urgency escape protection', cam: C('handheld', { intensity: 1.2 }), look: 'acao-epico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's50', prompt: 'a female blue-skinned alien carrying a wounded teenage hybrid through the jungle, sorrow urgency care, emotional', cam: C('tracking', { direction: 'left', intensity: 1.1 }), look: 'acao-epico', dur: 1.5, tout: { type: 'cut' } },
  { id: 's51', prompt: 'close-up of a distressed teenage alien-human hybrid face with a reflection of a glowing environment, anguish urgency', cam: C('push_in', { intensity: 0.8, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.0, cap: CAP('Não, não! Spider!'), tout: { type: 'cut' } },
  { id: 's52', prompt: 'a vast futuristic hangar full of people, flying vehicles and winged Navi-like creatures, industrial setting, epic scale gathering preparation', cam: C('crane', { intensity: 1.2, amplitude: 'dramatico' }), look: 'sci-fi-cyberpunk', dur: 2.0, tout: { type: 'cut' } },
  { id: 's53', prompt: 'close-up of a blue-skinned alien in military gear looking up with a determined expression, combat ready', cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'acao-epico', dur: 1.5, tout: { type: 'cut' } },
  { id: 's54', prompt: 'a winged flying creature with an alien rider flying in space against a huge spiraling blue planet, awe epic journey, stunning vast', cam: C('aerial', { intensity: 1.2, amplitude: 'dramatico' }), look: 'sci-fi-cyberpunk', dur: 2.5, tout: { type: 'crossfade', duration: 0.5 } },
  { id: 's55', prompt: 'close-up of a female blue-skinned alien face looking determined and slightly sad, resolve sorrow', cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.0, cap: CAP('Então, vamos achar outro caminho.'), tout: { type: 'cut' } },
  { id: 's56', prompt: 'a huge white whale-like creature being lifted out of the water by industrial machinery, water splashing, violence exploitation destruction, high angle', cam: C('dolly', { direction: 'down', intensity: 1.0 }), look: 'acao-epico', dur: 2.0, tout: { type: 'cut' } },
  { id: 's57', prompt: 'a blue-skinned alien couple standing side by side looking determined, flying creatures behind them, unity strength leadership, iconic pose', cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 1.8, tout: { type: 'cut' } },
  { id: 's58', prompt: 'a fierce female blue-skinned alien warrior advancing with a weapon, aggressive action, intense expression', cam: C('handheld', { intensity: 1.3, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's59', prompt: 'a chaotic aerial battle with multiple flying creatures and aircraft in combat, dynamic angles, intense aerial action', cam: C('handheld', { intensity: 1.3, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's60', prompt: 'a female blue-skinned alien warrior mounted on a winged creature drawing a bow to shoot, fierce expression, vibrant colors, intense action', cam: C('crash_zoom', { intensity: 1.0 }), look: 'acao-epico', dur: 0.8, tout: { type: 'cut' } },
  { id: 's61', prompt: 'a winged flying creature with a blue-skinned alien rider shooting an arrow, dynamic motion, aerial combat speed', cam: C('tracking', { direction: 'right', intensity: 1.2 }), look: 'acao-epico', dur: 0.8, tout: { type: 'cut' } },
  { id: 's62', prompt: 'a winged flying creature flying between floating mountains with purple light beams in the background, epic sci-fi scenery, imminent danger', cam: C('tracking', { direction: 'left', intensity: 1.1 }), look: 'sci-fi-cyberpunk', dur: 0.8, tout: { type: 'cut' } },
  { id: 's63', prompt: 'a female blue-skinned alien warrior on the ground looking up in anguish, fire and destruction behind her, despair', cam: C('push_in', { intensity: 1.0 }), look: 'acao-epico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's64', prompt: 'close-up of a blue-skinned alien child with large amber eyes looking up in fear, vulnerable innocence threatened', cam: C('static', { breath: 0.5 }), look: 'cinema-dramatico', dur: 0.9, tout: { type: 'cut' } },
  { id: 's65', prompt: 'a blue-skinned alien couple embracing with expressions of pain and worry, intimacy amid danger, sorrow union', cam: C('static', { breath: 0.5 }), look: 'cinema-dramatico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's66', prompt: 'close-up of a male blue-skinned alien with red markings looking with determination and rage, fire behind him, aggressive menace', cam: C('static', { breath: 0.6 }), look: 'acao-epico', dur: 0.9, tout: { type: 'cut' } },
  { id: 's67', prompt: 'two male blue-skinned aliens in melee combat on an elevated structure, dynamic action, direct confrontation, intense fight', cam: C('truck', { direction: 'right', intensity: 1.2, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's68', prompt: 'close-up of a male blue-skinned alien with a weapon aiming with an expression of rage, fury combat readiness', cam: C('static', { breath: 0.6 }), look: 'acao-epico', dur: 0.9, tout: { type: 'cut' } },
  { id: 's69', prompt: 'a female blue-skinned alien mounted on a winged creature flying, aerial action, motion', cam: C('tracking', { direction: 'right', intensity: 1.2 }), look: 'acao-epico', dur: 0.9, tout: { type: 'cut' } },
  { id: 's70', prompt: 'multiple winged flying creatures flying in formation with a blue planet behind, cosmic scenery, imminent battle, epic grand', cam: C('aerial', { intensity: 1.2, amplitude: 'dramatico' }), look: 'sci-fi-cyberpunk', dur: 1.5, tout: { type: 'cut' } },
  { id: 's71', prompt: 'close-up of a female blue-skinned alien roaring with a bow in hand, fierce war cry, fury', cam: C('crash_zoom', { intensity: 1.1 }), look: 'acao-epico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's72', kind: 'white', cam: C('static', { breath: 0 }), look: 'noir-film', dur: 0.18, tout: { type: 'cut' } },
  { id: 's73', prompt: 'close-up of a female blue-skinned alien with red markings and a feather headdress smiling confidently and menacingly, arrogance power', cam: C('static', { breath: 0.5 }), look: 'cinema-dramatico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's74', prompt: 'close-up of a female blue-skinned alien roaring with teeth bared and war paint, fury determination', cam: C('crash_zoom', { intensity: 1.1 }), look: 'acao-epico', dur: 1.0, tout: { type: 'dip_to_black', duration: 0.4 } },

  // ---------- 6. FINALE TEMÁTICO + CARTELA (2:15-2:30) ----------
  { id: 's75', reuse: 's64', cam: C('push_in', { intensity: 0.5, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.6, cap: CAP('Sua deusa...'), tout: { type: 'cut' } },
  { id: 's76', reuse: 's73', cam: C('static', { breath: 0.4 }), look: 'cinema-dramatico', dur: 2.6, cap: CAP('...não tem autoridade aqui.', '#ff6a1a'), tout: { type: 'dip_to_black', duration: 0.6 } },
  { id: 's77', kind: 'ember', cam: C('push_in', { intensity: 0.5 }), look: 'acao-epico', dur: 4.0, cap: TITLE('FOGO E CINZAS', 'AVATAR — Trailer Oficial'), tout: { type: 'dip_to_black', duration: 0.6 } },
  { id: 's78', kind: 'black', cam: C('static', { breath: 0 }), look: 'noir-film', dur: 2.8, cap: { kicker: 'simulação em fotos do', title: 'TRAILER AVATAR', body: 'pixflow-motion · flux2-klein', position: 'center', align: 'center', accent: '#8a8f98' }, tout: { type: 'dip_to_black', duration: 0.6 } },

  // ---------- CTA INEMA.CLUB ----------
  { id: 's79', kind: 'ember', cam: C('push_in', { intensity: 0.5, easing: 'ease_in_out' }), look: 'acao-epico', dur: 4.6, cap: { kicker: 'assista mais em', title: 'INEMA.CLUB', body: 'cursos · ferramentas · IA', position: 'center', align: 'center', accent: '#ffb347' }, tout: { type: 'cut' } },
];

// ---------- gerar imagens ----------
const EMBER = 'dark cinematic background of glowing orange embers and floating sparks rising through black smoke, deep pure black background, atmospheric fire particles, no text, empty center';

function solidColor(path, color) {
  if (existsSync(path)) return;
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=${color}:s=1280x720`, '-frames:v', '1', path]);
  if (r.status !== 0) throw new Error('ffmpeg solid ' + color);
}

async function ensureImages() {
  if (NOIMG) return;
  // bg sintéticos
  const ember = join(ASSETS, 'ember.png');
  if (!existsSync(ember)) { process.stdout.write('-> ember ... '); await generateImage(ember, `${EMBER}, ${STYLE}`, { model: 'flux2-klein', width: 1280, height: 720, steps: 4, seed: 700 }); console.log('ok'); }
  solidColor(join(ASSETS, 'black.png'), 'black');
  solidColor(join(ASSETS, 'white.png'), 'white');
  // shots
  let seed = 100;
  for (const s of SHOTS) {
    seed++;
    if (s.reuse || s.kind) continue; // reuse aponta p/ outro; kind usa bg sintético
    const out = join(ASSETS, `${s.id}.png`);
    if (existsSync(out)) { console.log(`-> ${s.id} (já existe)`); continue; }
    process.stdout.write(`-> ${s.id} ... `);
    await generateImage(out, `${s.prompt}, ${STYLE}`, { model: 'flux2-klein', width: 1280, height: 720, steps: 4, seed });
    console.log('ok');
  }
}

// resolve qual arquivo de imagem cada shot usa
function fileFor(s) {
  if (s.kind === 'ember') return 'assets/ember.png';
  if (s.kind === 'black') return 'assets/black.png';
  if (s.kind === 'white') return 'assets/white.png';
  if (s.reuse) return `assets/${s.reuse}.png`;
  return `assets/${s.id}.png`;
}

// ---------- escrever YAML ----------
function y(obj) { return JSON.stringify(obj); } // flow-style compacto (YAML aceita JSON)

function buildYaml() {
  const imgs = SHOTS.map((s) => `    - { id: ${s.id}, file: ${fileFor(s)} }`).join('\n');
  const scenes = SHOTS.map((s) => {
    const tout = s.tout || { type: 'cut' };
    const lines = [`  - id: ${s.id}`, `    image: ${s.id}`, `    look: ${s.look}`, `    duration: ${s.dur}`, `    camera: ${y(s.cam)}`];
    if (s.cap) lines.push(`    caption: ${y(s.cap)}`);
    lines.push(`    transition_out: ${y(tout)}`);
    return lines.join('\n');
  }).join('\n\n');

  return `# Avatar: Fogo e Cinzas — TRAILER COMPLETO (78 shots) — pixflow.movie/v1
# Gerado por build.mjs. Imagens flux2-klein; parallax 2.5D + efeitos; trilha sintetizada (gen-audio.mjs).
schema: pixflow.movie/v1

meta:
  title: Avatar Fogo e Cinzas — Trailer Completo (recriação/teste)
  author: nmaldaner

output:
  resolution: 1280x720
  fps: 30
  filename: avatar-fogo-cinzas-full.mp4

defaults:
  look: cinema-dramatico
  transition_out: { type: cut }

audio:
  track: trilha.wav
  volume: 0.92

assets:
  images:
${imgs}

scenes:
${scenes}
`;
}

// ---------- timeline.json (mesma lógica do layout.js) ----------
function buildTimeline() {
  const fps = 30;
  const sec = (v) => Math.max(1, Math.round((v || 0) * fps));
  let cursor = 0;
  const scenes = [];
  SHOTS.forEach((s, i) => {
    const durF = sec(s.dur);
    const prev = SHOTS[i - 1];
    const tName = prev?.tout?.type;
    const tDur = prev?.tout?.duration ?? 0.5;
    const fadeIn = (i > 0 && tName && tName !== 'cut') ? sec(tDur) : 0;
    const from = i === 0 ? 0 : cursor - fadeIn;
    scenes.push({ id: s.id, start: +(from / fps).toFixed(3), dur: s.dur, toutType: s.tout?.type || 'cut', kind: s.kind || (s.reuse ? 'reuse' : 'img') });
    cursor = from + durF;
  });
  const find = (id) => scenes.find((x) => x.id === id)?.start;
  return {
    fps, totalSec: +(cursor / fps).toFixed(3), scenes,
    marks: {
      teaserHit: 0.15,
      title1: find('s06'),
      worldStart: find('s08'),
      destructStart: find('s29'),
      climaxStart: find('s44'),
      whiteFlash: find('s72'),
      titleFinal: find('s77'),
      ctaStart: find('s79'),
    },
  };
}

// ---------- run ----------
const run = async () => {
  await ensureImages();
  writeFileSync(join(ROOT, 'avatar-full.movie.yaml'), buildYaml());
  const tl = buildTimeline();
  writeFileSync(join(ROOT, 'timeline.json'), JSON.stringify(tl, null, 2));
  console.log(`\nYAML + timeline escritos. ${SHOTS.length} cenas, total ~${tl.totalSec}s.`);
};
run().catch((e) => { console.error('FALHOU:', e.message); process.exit(1); });
