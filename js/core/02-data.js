/* ===== DATEN ===== */
const N=120,CELL=2400,WORLD=N*CELL,HALF=WORLD/2,TURRET=120,AGGRO=1500,SEED=20260427,KEY='galaxy_empire_save_v5',SPDX=1.2;
const STEEL_PM=120;
const RES=[
 {k:'steel',n:'Stahl',i:'fa-cubes',c:'text-slate-300',p:4},
 {k:'coal',n:'Kohle',i:'fa-fire',c:'text-amber-600',p:5},
 {k:'copper',n:'Kupfer',i:'fa-microchip',c:'text-orange-400',p:6},
 {k:'food',n:'Nahrung',i:'fa-wheat-awn',c:'text-emerald-400',p:3},
 {k:'water',n:'Wasser',i:'fa-droplet',c:'text-blue-400',p:3},
 {k:'crystals',n:'Kristalle',i:'fa-gem',c:'text-purple-400',p:25},
 {k:'diamonds',n:'Diamanten',i:'fa-gem',c:'text-cyan-300',p:120}];
const RN={credits:'Credits'};RES.forEach(r=>RN[r.k]=r.n);
const BIOMES=[
 {name:'Terra-Welt',color:'#38bdf8',res:'food'},{name:'Vulkanwelt',color:'#f97316',res:'coal'},
 {name:'Trockene Erzwelt',color:'#eab308',res:'copper'},{name:'Ozeanwelt',color:'#0284c7',res:'water'},
 {name:'Kristall-Eiswelt',color:'#a855f7',res:'crystals'},{name:'Eisenkern-Welt',color:'#94a3b8',res:'steel'}];
const SHIPS=[
 {id:'scout',name:'Aufklärer-Drohne',power:10,cost:{steel:40,copper:25},spd:130,pw:2,icon:'fa-paper-plane'},
 {id:'corvette',name:'Abfang-Korvette',power:35,cost:{steel:110,copper:55},spd:105,pw:6,icon:'fa-jet-fighter'},
 {id:'frigate',name:'Kampf-Fregatte',power:80,cost:{steel:240,copper:110,coal:70},spd:85,pw:12,icon:'fa-shuttle-space'},
 {id:'destroyer',name:'Schwerer Zerstörer',power:180,cost:{steel:480,copper:240,coal:140},spd:72,pw:24,req:'ship_destroyer',icon:'fa-shield-halved'},
 {id:'cruiser',name:'Aegis-Kreuzer',power:380,cost:{steel:950,copper:200,crystals:180},spd:62,pw:45,req:'ship_cruiser',icon:'fa-rocket'},
 {id:'battlecruiser',name:'Schlachtkreuzer',power:750,cost:{steel:1900,coal:380,crystals:450},spd:55,pw:80,req:'ship_bc',icon:'fa-crosshairs'},
 {id:'battleship',name:'Dread-Schlachtschiff',power:1500,cost:{steel:4200,crystals:1100,diamonds:90},spd:46,pw:140,req:'antimatter_cannons',icon:'fa-meteor'},
 {id:'carrier',name:'Flottenträger',power:2800,cost:{steel:7500,copper:2800,crystals:1800,diamonds:220},spd:40,pw:220,req:'carrier_cmd',icon:'fa-satellite-dish'},
 {id:'dreadnought',name:'Leviathan-Dreadnought',power:5000,cost:{steel:14000,crystals:4600,diamonds:700},spd:34,pw:380,req:'dreadnought_hulls',icon:'fa-skull'},
 {id:'flagship',name:'Titan-Flaggschiff',power:12000,cost:{steel:38000,crystals:14000,diamonds:2800},spd:28,pw:800,req:'titan_forge',icon:'fa-crown'}];
/* --- neue normale Schiffe --- */
SHIPS.push(
 {id:'gunship',name:'Kanonenboot',power:125,cost:{steel:330,copper:150,coal:90},spd:80,pw:15,req:'gunship_hulls',icon:'fa-burst'},
 {id:'stealth',name:'Tarn-Jäger',power:260,cost:{steel:620,copper:380,coal:160},spd:92,pw:30,req:'stealth_hulls',icon:'fa-user-ninja'},
 {id:'missile',name:'Raketenkreuzer',power:540,cost:{steel:1300,copper:450,crystals:260},spd:58,pw:60,req:'missile_tech',icon:'fa-explosion'},
 {id:'siege',name:'Belagerungsschiff',power:1100,cost:{steel:3000,coal:900,crystals:700},spd:42,pw:105,req:'siege_eng',icon:'fa-bomb'},
 {id:'command',name:'Kommandoschiff',power:3800,cost:{steel:10000,copper:3600,crystals:2600,diamonds:300},spd:38,pw:290,req:'command_ships',icon:'fa-chess-king'},
 {id:'annihilator',name:'Vernichter',power:8000,cost:{steel:26000,crystals:8000,diamonds:1500},spd:31,pw:560,req:'annihilator',icon:'fa-radiation'});
SHIPS.forEach(s=>{const p=s.power;s.power=Math.round(p*(p<=400?1:p<=1200?1.25:p<=3000?1.6:p<=5000?2:2.4))});
SHIPS.sort((a,b)=>a.power-b.power);
const TIERMAX=SHIPS.length-1;
/* --- Gacha-Superschiffe (20) --- */
const RAR={C:{n:'Gewöhnlich',c:'#94a3b8'},U:{n:'Ungewöhnlich',c:'#f472b6'},R:{n:'Selten',c:'#38bdf8'},E:{n:'Episch',c:'#c084fc'},L:{n:'Legendär',c:'#fbbf24'},M:{n:'Mythisch',c:'#00ff66'}};
const SDEF={
 R:{p0:9000,dp:400,spd:70,pw:30,n:['Nebel-Läufer','Schatten-Jäger','Ionen-Falke','Frost-Wächter','Sturm-Harpune','Nova-Lanze','Eisen-Aegis','Kometen-Sichel'],i:['fa-ghost','fa-user-ninja','fa-bolt','fa-snowflake','fa-hurricane','fa-burst','fa-shield-halved','fa-meteor']},
 E:{p0:16000,dp:800,spd:62,pw:40,n:['Quanten-Phantom','Sonnenschmied','Hurrikan-Titan','Dunkelstern-Lancer','Singularitäts-Wächter','Plasma-Drache'],i:['fa-atom','fa-sun','fa-hurricane','fa-moon','fa-shield-halved','fa-dragon']},
 L:{p0:26000,dp:1500,spd:55,pw:55,n:['Aeon-Richter','Void-Leviathan','Supernova-Herold','Chrono-Tyrann','Stern-Verschlinger'],i:['fa-gavel','fa-skull','fa-explosion','fa-hourglass-half','fa-biohazard']},
 M:{p0:200000,dp:0,spd:45,pw:100,n:['Grim Reaper'],i:['fa-star']}};
for(const t of ['R','E','L','M']){const d=SDEF[t];d.n.forEach((nm,k)=>SHIPS.push({id:'sx_'+t+k,name:nm,power:d.p0+d.dp*k,cost:{},spd:d.spd,pw:d.pw,icon:d.i[k],g:1,r:t}))}
const SHIP={};SHIPS.forEach(s=>SHIP[s.id]=s);
const TREES={weapons:{n:'Waffen',i:'fa-burst',c:'text-rose-400'},defense:{n:'Verteidigung',i:'fa-shield-halved',c:'text-sky-400'},prop:{n:'Antrieb',i:'fa-rocket',c:'text-amber-400'},eco:{n:'Wirtschaft',i:'fa-coins',c:'text-emerald-400'},ind:{n:'Schiffbau',i:'fa-industry',c:'text-orange-400'},cmd:{n:'Kommando',i:'fa-satellite-dish',c:'text-purple-400'},sci:{n:'Wissenschaft',i:'fa-atom',c:'text-sky-300'},spec:{n:'Exotisch',i:'fa-radiation',c:'text-fuchsia-400'}};
const TECHS=[];
function T(id,name,tree,desc,cost,max,req,fx){TECHS.push({id,name,tree,desc,cost,max,req:req||[],fx:fx||{}})}
T('lasers','Laser-Optimierung','weapons','+6% Waffenstärke je Stufe',{copper:150,crystals:40},5,[],{atk:.06});
T('railguns','Railguns','weapons','+8% Waffenstärke je Stufe',{steel:600,crystals:120},5,['lasers'],{atk:.08});
T('plasma_cannons','Plasmakanonen','weapons','+10% Waffenstärke je Stufe',{crystals:500,coal:800},5,['railguns'],{atk:.10});
T('antimatter_cannons','Antimaterie-Kanonen','weapons','+12% Waffenstärke; schaltet Schlachtschiffe frei',{crystals:1500,diamonds:120},3,['plasma_cannons'],{atk:.12});
T('ai_targeting','KI-Zielerfassung','weapons','+5% Waffenstärke je Stufe',{crystals:300,steel:500},5,['lasers'],{atk:.05});
T('orbital_bombardment','Orbitalbombardement','weapons','+10% Stärke bei Planetenangriffen',{steel:2500,crystals:900},5,['railguns'],{bomb:.10});
T('cyber_warfare','Cyberkrieg-Suite','weapons','Feindliche Geschütztürme -10% Stärke je Stufe',{crystals:3500,diamonds:600},3,['ai_targeting'],{tdis:.10});
T('plasma_shields','Plasma-Schilde','defense','+5% Panzerung je Stufe',{copper:200,crystals:60},6,[],{arm:.05});
T('armor_plating','Panzerplatten','defense','+6% Panzerung je Stufe',{steel:700,coal:300},5,['plasma_shields'],{arm:.06});
T('hyper_shielding','Hyper-Schilde','defense','+8% Panzerung je Stufe',{crystals:2500,diamonds:350},4,['armor_plating'],{arm:.08});
T('planetary_defenses','Planetare Festung','defense','+12% Stärke eigener Geschütztürme',{steel:3000,crystals:900},5,['plasma_shields'],{pdef:.12});
T('repair_nanites','Reparatur-Naniten','defense','-5% Schiffsverluste je Stufe (max. 50%)',{copper:900,crystals:400},6,['armor_plating'],{rep:.05});
T('ion_drives','Ionenantrieb','prop','+8% Geschwindigkeit je Stufe',{coal:300,copper:150},5,[],{spd:.08});
T('quantum_engines','Quantenantrieb','prop','+10% Geschwindigkeit je Stufe',{crystals:400,coal:800},5,['ion_drives'],{spd:.10});
T('warp_core','Warp-Kern','prop','+12% Geschwindigkeit je Stufe',{crystals:2000,diamonds:250},3,['quantum_engines'],{spd:.12});
T('inertial_dampeners','Trägheitsdämpfer','prop','+4% Geschw. und +3% Panzerung je Stufe',{steel:1500,crystals:600},4,['ion_drives'],{spd:.04,arm:.03});
T('automated_mining','Automatisierter Abbau','eco','+10% Rohstoffertrag je Stufe',{steel:300,copper:200},8,[],{eco:.10});
T('deep_core_drilling','Tiefenbohrung','eco','+12% Rohstoffertrag je Stufe',{steel:2000,crystals:500},6,['automated_mining'],{eco:.12});
T('fusion_reactors','Fusionsreaktoren','eco','+12% Energiekapazität je Stufe',{steel:600,copper:400},6,[],{pwr:.12});
T('dyson_harvesting','Dyson-Ernte','eco','+20% Energiekapazität je Stufe',{crystals:2500,diamonds:300},3,['fusion_reactors'],{pwr:.2});
T('trade_networks','Handelsnetzwerke','eco','-1,5% Marktgebühr je Stufe',{copper:500,crystals:100},6,[],{trade:.015});
T('market_intel','Marktanalyse','eco','+10% Credit-Einkommen je Stufe',{copper:900,crystals:250},5,['trade_networks'],{cred:.10});
T('colonial_admin','Kolonialverwaltung','eco','+5% Ertrag, +8% Credits je Stufe',{steel:1500,coal:900},5,['automated_mining'],{eco:.05,cred:.08});
T('ship_destroyer','Zerstörer-Rümpfe','ind','Schaltet Schwere Zerstörer frei',{steel:900,copper:500},1);
T('ship_cruiser','Kreuzer-Design','ind','Schaltet Aegis-Kreuzer frei',{steel:2500,crystals:500},1,['ship_destroyer']);
T('ship_bc','Schlachtkreuzer-Rümpfe','ind','Schaltet Schlachtkreuzer frei',{steel:6000,crystals:1500},1,['ship_cruiser']);
T('carrier_cmd','Trägerkommando','ind','Schaltet Flottenträger frei',{steel:12000,crystals:3500},1,['ship_bc']);
T('dreadnought_hulls','Dreadnought-Rümpfe','ind','Schaltet Leviathan-Dreadnoughts frei',{steel:30000,diamonds:1200},1,['carrier_cmd','antimatter_cannons']);
T('titan_forge','Titan-Schmiede','ind','Schaltet Titan-Flaggschiffe frei',{steel:80000,crystals:20000,diamonds:4000},1,['dreadnought_hulls']);
T('fleet_logistics','Flottenlogistik','ind','-3% Schiffskosten je Stufe',{steel:800,copper:500},5,[],{cost:.03});
T('nanite_construction','Nanitenbau','ind','-3% Schiffskosten je Stufe',{steel:3000,copper:2000},5,['fleet_logistics'],{cost:.03});
T('subspace_comms','Subraum-Kommunikation','cmd','Frühwarnung: +600 Warnreichweite je Stufe',{copper:600,crystals:200},4,[],{warn:600});
T('tactical_ai','Taktik-KI','cmd','+4% Waffenstärke und Panzerung je Stufe',{crystals:1200,copper:1500},5,['ai_targeting','subspace_comms'],{atk:.04,arm:.04});
/* --- erweiterter Forschungsbaum (req: 'id' oder 'id:Mindeststufe') --- */
T('missile_tech','Raketentechnik','weapons','+7% Waffenstärke; schaltet Raketenkreuzer frei',{steel:1800,copper:900},4,['railguns'],{atk:.07});
T('beam_focus','Strahlfokussierung','weapons','+6% Waffenstärke je Stufe',{crystals:1800,copper:2000},5,['plasma_cannons:2','ai_targeting:2'],{atk:.06});
T('siege_eng','Belagerungstechnik','weapons','+8% bei Planetenangriffen; schaltet Belagerungsschiffe frei',{steel:5000,crystals:1200},3,['orbital_bombardment','missile_tech'],{bomb:.08});
T('emp_burst','EMP-Impulse','weapons','Feindliche Türme -8% Stärke je Stufe',{crystals:4200,diamonds:700},3,['cyber_warfare'],{tdis:.08});
T('annihilator','Vernichter-Programm','weapons','+10% Waffenstärke; schaltet Vernichter frei',{steel:60000,crystals:15000,diamonds:3000},2,['antimatter_cannons:2','siege_eng:2'],{atk:.10});
T('reactive_armor','Reaktivpanzerung','defense','+7% Panzerung je Stufe',{steel:3500,coal:2000},4,['armor_plating:3'],{arm:.07});
T('def_grid','Verteidigungsnetz','defense','+20% Verteidigungsradius um Planeten je Stufe',{steel:2000,crystals:700},4,['planetary_defenses'],{grad:.2});
T('damage_control','Schadenskontrolle','defense','-4% Verluste je Stufe',{copper:3000,crystals:1500},4,['repair_nanites:3'],{rep:.04});
T('point_defense','Nahbereichsabwehr','defense','+6% Panzerung und Turmstärke je Stufe',{crystals:2200,copper:2500},4,['hyper_shielding','planetary_defenses'],{arm:.06,pdef:.06});
T('orbital_fort','Orbitalfestungen','defense','+15% Turmstärke je Stufe',{steel:9000,crystals:3000,diamonds:500},4,['planetary_defenses:3','def_grid:2'],{pdef:.15});
T('mine_tech','Orbitalminen','defense','Schaltet Weltraumminen frei (Bau in der Raumwerft, Transport und Ablegen per Flotte)',{steel:6000,copper:3500,crystals:900},1,['plasma_shields:3','reactive_armor:1','planetary_defenses:2'],{});
T('mine_dmg','Minen-Sprengkraft','defense','+20% Minenschaden je Stufe',{steel:1500,coal:900,crystals:200},5,['mine_tech'],{mdmg:.2});
T('mine_field','Minenfelder','defense','+10 Minen-Kapazität und +10% Auslöse-Radius je Stufe',{copper:1800,crystals:350},4,['mine_tech'],{mcap:10,mrad:.1});
T('mine_gacha','Panzerbrechende Minen','defense','+25% Minenschaden gegen Superschiffe je Stufe',{crystals:2500,diamonds:200},3,['mine_dmg:3'],{mgx:.25});
T('flak_tech','Stationäre Flak','defense','Schaltet Flak-Plattformen frei (nur auf eigenen Planeten)',{steel:300,copper:180},1,['plasma_shields'],{});
T('flak_dmg','Flak-Feuerkraft','defense','+20% Flak-Schaden je Stufe',{steel:2500,crystals:500},5,['flak_tech'],{fdmg:.2});
T('flak_rng','Flak-Reichweite','defense','+10% Flak-Reichweite je Stufe',{copper:2200,crystals:400},4,['flak_tech'],{frng:.1});
T('flak_slots','Flak-Batterien','defense','+1 Flak-Plattform pro Planet je Stufe',{steel:4000,crystals:1200},5,['flak_dmg:2'],{fslot:1});
T('afterburners','Nachbrenner','prop','+6% Geschwindigkeit je Stufe',{coal:1200,copper:600},4,['ion_drives:2'],{spd:.06});
T('emergency_jump','Notsprung-Protokoll','prop','+25% Rückzugstempo je Stufe',{crystals:900,coal:1500},4,['quantum_engines'],{retr:.25});
T('gravity_lens','Gravitationslinsen','prop','+8% Geschwindigkeit je Stufe',{crystals:3000,diamonds:400},3,['warp_core','afterburners:2'],{spd:.08});
T('asteroid_refining','Asteroidenraffinerie','eco','+10% Rohstoffertrag je Stufe',{steel:4000,copper:2500},6,['deep_core_drilling'],{eco:.10});
T('stock_exchange','Sternenbörse','eco','+12% Credit-Einkommen je Stufe',{copper:4000,crystals:1500},5,['market_intel'],{cred:.12});
T('plunder_doctrine','Plünderungsdoktrin','eco','+25% Beute bei Siegen je Stufe',{steel:2500,coal:1500},5,['colonial_admin'],{loot:.25});
T('orbital_elevators','Orbitale Aufzüge','eco','+8% Ertrag, +5% Credits je Stufe',{steel:8000,crystals:2500},5,['asteroid_refining:2','colonial_admin:2'],{eco:.08,cred:.05});
T('zero_point','Nullpunktenergie','eco','+25% Energiekapazität je Stufe',{crystals:7000,diamonds:1200},3,['dyson_harvesting'],{pwr:.25});
T('gunship_hulls','Kanonenboot-Rümpfe','ind','Schaltet Kanonenboote frei',{steel:300,copper:200},1,[]);
T('stealth_hulls','Tarnrümpfe','ind','Schaltet Tarn-Jäger frei',{steel:1400,copper:900},1,['ship_destroyer','gunship_hulls']);
T('mass_production','Massenfertigung','ind','-3% Schiffskosten je Stufe',{steel:9000,copper:6000},4,['nanite_construction:3'],{cost:.03});
T('command_ships','Kommandoschiffe','ind','Schaltet Kommandoschiffe frei',{steel:20000,crystals:6000},1,['carrier_cmd','tactical_ai']);
T('recon_net','Aufklärungsnetz','cmd','+800 Warnreichweite je Stufe',{copper:2500,crystals:800},4,['subspace_comms:2'],{warn:800});
T('rally_cry','Schlachtruf','cmd','+5% Waffenstärke je Stufe',{crystals:3000,copper:2500},4,['tactical_ai'],{atk:.05});
T('fleet_doctrine','Flottendoktrin','cmd','+4% Waffenstärke und Panzerung je Stufe',{crystals:6000,diamonds:900},5,['rally_cry:2'],{atk:.04,arm:.04});
T('supreme_command','Oberkommando','cmd','+6% Waffen, Panzerung und Tempo je Stufe',{crystals:14000,diamonds:3000},3,['fleet_doctrine:3','recon_net:2'],{atk:.06,arm:.06,spd:.06});
T('research_methods','Forschungsmethodik','sci','+8% Forschungstempo je Stufe',{copper:300,crystals:60},8,[],{rspd:.08});
T('cheap_science','Effiziente Experimente','sci','-3% Forschungskosten je Stufe',{copper:1200,steel:1200},6,['research_methods:2'],{tcost:.03});
T('data_centers','Rechenzentren','sci','+10% Forschungstempo je Stufe',{copper:1500,crystals:300},6,['research_methods'],{rspd:.10});
T('xeno_archaeology','Xenoarchäologie','sci','+2 Warp-Tokens pro Tagesbelohnung je Stufe',{crystals:2000,copper:2000},5,['data_centers'],{tok:2});
T('quantum_computing','Quantencomputer','sci','+15% Forschungstempo je Stufe',{crystals:3500,diamonds:300},5,['data_centers:2'],{rspd:.15});
T('oracle','Sternenorakel','sci','+10% Superschiff-Dropchance (relativ) je Stufe',{crystals:5000,diamonds:800},3,['xeno_archaeology:2'],{orc:.10});
T('ai_scientists','KI-Wissenschaftler','sci','+20% Forschungstempo je Stufe',{crystals:9000,diamonds:1500},4,['quantum_computing:2'],{rspd:.20});
T('dark_matter','Dunkle-Materie-Forschung','spec','+8% Waffenstärke und Energie je Stufe',{crystals:6000,diamonds:1000},4,['antimatter_cannons','zero_point'],{atk:.08,pwr:.08});
T('time_dilation','Zeitdilatation','spec','+30% Offline-Fortschritt und längere Offline-Zeit je Stufe',{crystals:8000,diamonds:1500},3,['quantum_computing'],{off:.3});
T('gravity_weapons','Gravitationswaffen','spec','+10% Planetenangriff, Türme -10% je Stufe',{crystals:12000,diamonds:2200},3,['dark_matter:2','siege_eng:2'],{bomb:.10,tdis:.10});
T('singularity_core','Singularitätskern','spec','+10% Waffen, Panzerung und Ertrag je Stufe',{crystals:30000,diamonds:8000},2,['dark_matter:3','gravity_weapons','supreme_command'],{atk:.10,arm:.10,eco:.10});
const BLD={
 mine:{n:'Förderanlage',i:'fa-cubes',c:'text-cyan-400',cost:{steel:80,coal:40}},
 power:{n:'Kraftwerk',i:'fa-bolt',c:'text-yellow-400',cost:{steel:100,copper:60}},
 turret:{n:'Geschützturm-Matrix',i:'fa-shield-halved',c:'text-rose-400',cost:{steel:150,crystals:30}},
 lab:{n:'Forschungslabor',i:'fa-flask',c:'text-purple-400',cost:{steel:200,copper:150,crystals:20}},
 hub:{n:'Handelszentrum',i:'fa-coins',c:'text-amber-400',cost:{steel:150,copper:100}},
 yard:{n:'Raumwerft',i:'fa-industry',c:'text-orange-400',cost:{steel:250,copper:120,coal:80}}};
const BMAX=20;
