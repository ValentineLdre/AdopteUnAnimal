/* ===== Bannières défilantes de l'accueil =====
   g : dégradé de secours | img : photo (ex. 'images/chat.jpg') | e : petit titre | t : titre | p : texte
   c : bouton [libellé, page] (pages : accueil, animaux, apropos, quizz, adopter, famille) */
const SLIDERS={
  hero1:[
  {g:'linear-gradient(135deg,#3C6E63,#1B2B22)',e:'Chats',t:'Des chats de tous caractères attendent leur foyer',p:"Du chaton joueur au chat senior calme, chacun a sa fiche détaillée.",c:['Découvrez nos protégés','animaux']},
  {g:'linear-gradient(135deg,#A8503A,#3A2015)',e:'Chiens',t:'Un compagnon pour chaque mode de vie',p:"Petits ou grands, énergiques ou tranquilles, tous évalués avant adoption.",c:['Découvrez nos protégés','animaux']},
  {g:'linear-gradient(135deg,#C89B3C,#5A430F)',e:'Rongeurs et oiseaux',t:"Les petits protégés méritent autant d'attention",p:"Lapins, cochons d'Inde, perruches : des fiches pensées pour les débutants.",c:['Découvrez nos protégés','animaux']},
  {g:'linear-gradient(135deg,#5B7A6B,#0E1712)',e:'Reptiles',t:'Des reptiles confiés avec leur matériel',p:"Terrarium, fiche d'entretien et accompagnement pour un premier reptile.",c:['Découvrez nos protégés','animaux']}
],
  hero2:[
  {g:'linear-gradient(135deg,#1B2B22,#3C6E63)',e:"Pourquoi adopter",t:"Adopter, c'est sauver une vie",p:"Chaque adoption libère une place pour un autre animal en détresse."},
  {g:'linear-gradient(135deg,#5A430F,#C89B3C)',e:"Pourquoi adopter",t:"Un animal déjà suivi",p:"Nos animaux sont examinés par un vétérinaire avant de partir."},
  {g:'linear-gradient(135deg,#3A2015,#A8503A)',e:"Pourquoi adopter",t:"Un caractère déjà connu",p:"Les bénévoles les observent des semaines : vous savez à qui vous avez affaire."},
  {g:'linear-gradient(135deg,#0E1712,#5B7A6B)',e:"Pourquoi adopter",t:"Agir contre l'abandon",p:"Adopter plutôt qu'acheter, c'est refuser que les refuges débordent."}
],
  hero3:[
  {g:'linear-gradient(135deg,#3C6E63,#123028)',e:"Famille d'accueil",t:"Qu'est-ce qu'une famille d'accueil ?",p:"Un foyer qui héberge un animal temporairement, avant son adoption.",c:["DEVENIR FAMILLE D'ACCUEIL",'famille']},
  {g:'linear-gradient(135deg,#A8503A,#3A2015)',e:"Famille d'accueil",t:"Un engagement limité dans le temps",p:"Quelques semaines ou quelques mois, selon l'animal et vos disponibilités.",c:["DEVENIR FAMILLE D'ACCUEIL",'famille']},
  {g:'linear-gradient(135deg,#C89B3C,#5A430F)',e:"Famille d'accueil",t:"L'association prend les frais en charge",p:"Soins, alimentation et matériel : vous apportez surtout votre temps.",c:["DEVENIR FAMILLE D'ACCUEIL",'famille']},
  {g:'linear-gradient(135deg,#5B7A6B,#0E1712)',e:"Famille d'accueil",t:"Une place libérée au refuge",p:"Chaque famille d'accueil permet de recueillir un animal de plus.",c:["DEVENIR FAMILLE D'ACCUEIL",'famille']}
],
  hero4:[
  {g:'linear-gradient(135deg,#123028,#3C6E63)',e:"Animal malade",t:"Un animal malade peut vivre longtemps et heureux",p:"Beaucoup de maladies chroniques se gèrent bien avec un suivi adapté."},
  {g:'linear-gradient(135deg,#3A2015,#A8503A)',e:"Animal malade",t:"Suivre le protocole du vétérinaire",p:"Traitements, régime, contrôles : la régularité fait toute la différence."},
  {g:'linear-gradient(135deg,#5A430F,#C89B3C)',e:"Animal malade",t:"Adapter son quotidien",p:"Alimentation, repos, cohabitation : chaque fiche précise les besoins de l'animal."},
  {g:'linear-gradient(135deg,#0E1712,#5B7A6B)',e:"Animal malade",t:"Ne pas rester seul",p:"Le refuge et son vétérinaire restent joignables après l'adoption."}
]
};

/* ===== Espèces, filtres et animaux ===== */
const SPECIES = [
  { key:'chats', label:'Chats', color:'linear-gradient(135deg,#3C6E63,#1B2B22)', icon:'<path d="M4 8l3-4 2 3h6l2-3 3 4v9a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/>' },
  { key:'chiens', label:'Chiens', color:'linear-gradient(135deg,#A8503A,#3A2015)', icon:'<path d="M4 10c0-2 2-4 4-4l1 2h6l1-2c2 0 4 2 4 4v6a3 3 0 01-3 3H7a3 3 0 01-3-3z"/><circle cx="9" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/>' },
  { key:'rongeurs', label:'Rongeurs', color:'linear-gradient(135deg,#C89B3C,#5A430F)', icon:'<ellipse cx="12" cy="14" rx="7" ry="5"/><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/>' },
  { key:'oiseaux', label:'Oiseaux', color:'linear-gradient(135deg,#3C6E63,#123028)', icon:'<path d="M3 13c4-6 12-8 18-4-3 1-4 2-4 4 0 3-3 5-7 5-2 0-3-1-3-1l-4 3 1-4c-1-1-1-2-1-3z"/>' },
  { key:'reptiles', label:'Reptiles', color:'linear-gradient(135deg,#5B7A6B,#0E1712)', icon:'<path d="M3 16c2-6 5-10 9-10s5 3 5 5-2 2-3 2 3 1 3 4-3 3-6 3-5-1-8-4z"/>' },
];

const CHARACTERS = ['calme','joueur','affectueux','indépendant','curieux','protecteur','sociable','timide'];

let ANIMALS = [
  // Chats
  {species:'chats', name:'Mimi', ageCat:'jeune', ageLabel:'8 mois', character:'joueur', socia:'groupe', desc:"Chatonne très vive, adore les jouets à plumes. S'entend bien avec d'autres chats."},
  {species:'chats', name:'Basile', ageCat:'adulte', ageLabel:'3 ans', character:'calme', socia:'seul', desc:"Chat casanier qui apprécie les foyers tranquilles, sans autre animal."},
  {species:'chats', name:'Nala', ageCat:'senior', ageLabel:'11 ans', character:'affectueux', socia:'enfants', desc:"Très câline, habituée aux enfants, cherche un canapé pour finir ses jours."},
  {species:'chats', name:'Gary', ageCat:'adulte', ageLabel:'2 ans', character:'indépendant', socia:'seul', desc:"Peu démonstratif mais présent, préfère les foyers sans autre chat."},
  {species:'chats', name:'Pixel', ageCat:'jeune', ageLabel:'5 mois', character:'curieux', socia:'groupe', desc:"Explore tout, s'entend très bien avec ses frères et sœurs de portée."},
  {species:'chats', name:'Olive', ageCat:'senior', ageLabel:'9 ans', character:'timide', socia:'seul', desc:"A besoin de temps pour faire confiance, foyer calme sans jeune enfant recommandé."},

  // Chiens
  {species:'chiens', name:'Rex', ageCat:'adulte', ageLabel:'4 ans', character:'protecteur', socia:'enfants', desc:"Berger croisé bien éduqué, très attaché à sa famille, bon avec les enfants."},
  {species:'chiens', name:'Luna', ageCat:'jeune', ageLabel:'10 mois', character:'joueur', socia:'groupe', desc:"Débordante d'énergie, a besoin d'un jardin et de sorties quotidiennes."},
  {species:'chiens', name:'Papy', ageCat:'senior', ageLabel:'10 ans', character:'calme', socia:'seul', desc:"Vieux monsieur tranquille, courtes promenades, cherche un canapé confortable."},
  {species:'chiens', name:'Mia', ageCat:'adulte', ageLabel:'3 ans', character:'affectueux', socia:'enfants', desc:"Très douce, habituée à la vie de famille avec deux enfants en famille d'accueil."},
  {species:'chiens', name:'Toby', ageCat:'jeune', ageLabel:'7 mois', character:'sociable', socia:'groupe', desc:"S'entend avec tous les chiens rencontrés en promenade collective."},
  {species:'chiens', name:'Iris', ageCat:'adulte', ageLabel:'5 ans', character:'timide', socia:'seul', desc:"Craintive avec les inconnus, progresse bien avec de la patience, sans jeunes enfants."},

  // Rongeurs
  {species:'rongeurs', name:'Choupette', ageCat:'jeune', ageLabel:'4 mois', character:'joueur', socia:'groupe', desc:"Cochon d'Inde très sociable, à adopter avec au moins un congénère."},
  {species:'rongeurs', name:'Réglisse', ageCat:'adulte', ageLabel:'1 an', character:'curieux', socia:'groupe', desc:"Lapine curieuse, litière acquise, cherche un binôme ou une famille expérimentée."},
  {species:'rongeurs', name:'Noisette', ageCat:'senior', ageLabel:'3 ans', character:'calme', socia:'seul', desc:"Hamster tranquille, préfère un environnement calme et peu manipulé."},
  {species:'rongeurs', name:'Cannelle', ageCat:'jeune', ageLabel:'6 mois', character:'sociable', socia:'enfants', desc:"Lapine très douce, habituée à être manipulée, bonne pour une famille avec enfants."},
  {species:'rongeurs', name:'Praline', ageCat:'adulte', ageLabel:'2 ans', character:'indépendant', socia:'seul', desc:"Chinchilla qui apprécie son propre espace, manipulation limitée conseillée."},

  // Oiseaux
  {species:'oiseaux', name:'Kiwi', ageCat:'jeune', ageLabel:'8 mois', character:'joueur', socia:'groupe', desc:"Perruche ondulée très active, s'épanouit avec au moins un compagnon."},
  {species:'oiseaux', name:'Saphir', ageCat:'adulte', ageLabel:'2 ans', character:'curieux', socia:'seul', desc:"Perruche calopsitte apprivoisée, sort volontiers de sa cage pour explorer."},
  {species:'oiseaux', name:'Plume', ageCat:'senior', ageLabel:'6 ans', character:'calme', socia:'seul', desc:"Diamant mandarin tranquille, apprécie une cage spacieuse et peu de bruit."},
  {species:'oiseaux', name:'Coco', ageCat:'adulte', ageLabel:'4 ans', character:'sociable', socia:'groupe', desc:"Perruche très vocale, recherche un foyer avec présence humaine fréquente."},

  // Reptiles
  {species:'reptiles', name:'Ficelle', ageCat:'adulte', ageLabel:'3 ans', character:'calme', socia:'seul', desc:"Pogona docile, terrarium et matériel fournis avec l'adoption."},
  {species:'reptiles', name:'Igor', ageCat:'senior', ageLabel:'7 ans', character:'indépendant', socia:'seul', desc:"Gecko léopard peu manipulé, convient à un adoptant déjà expérimenté."},
  {species:'reptiles', name:'Zelda', ageCat:'jeune', ageLabel:'1 an', character:'curieux', socia:'seul', desc:"Tortue de Floride jeune, nécessite un bassin déjà installé chez l'adoptant."},
  {species:'reptiles', name:'Boa', ageCat:'adulte', ageLabel:'5 ans', character:'calme', socia:'seul', desc:"Python royal très docile, habitué à la manipulation, dossier vétérinaire complet."},
];


/* ===== Détails des fiches animaux =====
   Ajoutez photos:['images/mimi-1.jpg','images/mimi-2.jpg','images/mimi-3.jpg','images/mimi-4.jpg'] et maladie:'texte' */
ANIMALS.forEach((a,i)=>a.id='a'+i);
const DETAILS={
 Mimi:{race:'Européen',sexe:'Femelle',poids:'2,8 kg'},
 Basile:{race:'Européen',sexe:'Mâle',poids:'4,6 kg'},
 Nala:{race:'Européen',sexe:'Femelle',poids:'3,9 kg',maladie:"Insuffisance rénale légère : alimentation spécifique et contrôle sanguin tous les 6 mois."},
 Gary:{race:'Européen',sexe:'Mâle',poids:'5 kg',maladie:"Porteur du FIV. Vie normale possible avec un suivi vétérinaire ; cohabitation avec d'autres chats à valider avec le vétérinaire."},
 Pixel:{race:'Européen',sexe:'Mâle',poids:'1,9 kg'},
 Olive:{race:'Européen',sexe:'Femelle',poids:'3,4 kg'},
 Rex:{race:'Berger croisé',sexe:'Mâle',poids:'28 kg'},
 Luna:{race:'Border collie croisé',sexe:'Femelle',poids:'17 kg'},
 Papy:{race:'Labrador croisé',sexe:'Mâle',poids:'32 kg',maladie:"Arthrose : traitement anti-douleur quotidien, promenades courtes."},
 Mia:{race:'Beagle croisé',sexe:'Femelle',poids:'12 kg'},
 Toby:{race:'Croisé',sexe:'Mâle',poids:'11 kg'},
 Iris:{race:'Croisée',sexe:'Femelle',poids:'15 kg'},
 Choupette:{race:"Cochon d'Inde",sexe:'Femelle',poids:'650 g'},
 Réglisse:{race:'Lapin bélier',sexe:'Femelle',poids:'1,8 kg'},
 Noisette:{race:'Hamster doré',sexe:'Mâle',poids:'130 g'},
 Cannelle:{race:'Lapin nain',sexe:'Femelle',poids:'1,2 kg'},
 Praline:{race:'Chinchilla',sexe:'Femelle',poids:'600 g'},
 Kiwi:{race:'Perruche ondulée',sexe:'Mâle',poids:'35 g'},
 Saphir:{race:'Perruche calopsitte',sexe:'Mâle',poids:'90 g'},
 Plume:{race:'Diamant mandarin',sexe:'Femelle',poids:'13 g'},
 Coco:{race:'Perruche à collier',sexe:'Mâle',poids:'120 g'},
 Ficelle:{race:'Pogona',sexe:'Mâle',poids:'400 g'},
 Igor:{race:'Gecko léopard',sexe:'Mâle',poids:'60 g'},
 Zelda:{race:'Tortue de Floride',sexe:'Femelle',poids:'350 g'},
 Boa:{race:'Python royal',sexe:'Mâle',poids:'1,4 kg'}
};

/* ===== Quizz ===== */
const QUIZ=[
 {t:"Quel animal pourrait me correspondre ?",d:"4 questions sur votre quotidien pour découvrir l'espèce qui vous irait le mieux.",g:'linear-gradient(135deg,#3C6E63,#1B2B22)',mode:'sp',qs:[
  ["Combien de temps passez-vous chez vous ?",[["Presque toute la journée",{chats:1,chiens:2,oiseaux:2}],["Quelques heures le soir",{chats:2,rongeurs:2,reptiles:1}],["Je suis souvent absent·e",{reptiles:2,chats:1,rongeurs:1}]]],
  ["Votre logement ?",[["Maison avec jardin",{chiens:3,chats:1}],["Appartement",{chats:2,rongeurs:1,oiseaux:1,reptiles:1}],["Petit studio",{rongeurs:2,reptiles:2,oiseaux:1}]]],
  ["Ce que vous attendez de lui ?",[["De la complicité et des balades",{chiens:3}],["De la tendresse tranquille",{chats:3,rongeurs:1}],["Observer un animal fascinant",{reptiles:3,oiseaux:1}],["De la compagnie qui anime la maison",{oiseaux:3,rongeurs:1}]]],
  ["Votre expérience avec les animaux ?",[["Débutant·e",{chats:1,rongeurs:1}],["Un peu d'expérience",{chiens:1,oiseaux:1}],["Confirmé·e",{reptiles:2,chiens:1}]]]]},
 {t:"Quelle personnalité d'animal serait idéale pour moi ?",d:"Un quizz sur votre caractère pour trouver le tempérament qui s'accordera au vôtre.",g:'linear-gradient(135deg,#A8503A,#3A2015)',mode:'ch',qs:[
  ["Votre samedi idéal ?",[["Une sortie en pleine nature",{joueur:2,sociable:1}],["Canapé et film",{calme:2,affectueux:1}],["Visiter un lieu inconnu",{curieux:2,indépendant:1}],["Un moment seul·e au calme",{timide:1,indépendant:2}]]],
  ["Entre amis, vous êtes plutôt…",[["Le boute-en-train",{sociable:2,joueur:1}],["Celui ou celle qui veille sur les autres",{protecteur:2,affectueux:1}],["Discret·e mais fidèle",{timide:2,calme:1}],["Libre, à votre façon",{indépendant:2}]]],
  ["Ce que vous attendez de lui ?",[["Qu'il me suive partout",{affectueux:2,protecteur:1}],["Qu'il me fasse rire",{joueur:2,curieux:1}],["Qu'il respecte mon rythme",{calme:2,indépendant:1}],["Qu'il s'attache à son rythme",{timide:2,curieux:1}]]]]},
 {t:"Trouvez mon compagnon dans le catalogue",d:"Indiquez vos préférences : nous vous proposons les animaux de nos fiches qui correspondent.",g:'linear-gradient(135deg,#C89B3C,#5A430F)',mode:'m',qs:[
  ["Quelle espèce vous attire ?",[["Chat",{sp:'chats'}],["Chien",{sp:'chiens'}],["Rongeur",{sp:'rongeurs'}],["Oiseau",{sp:'oiseaux'}],["Reptile",{sp:'reptiles'}],["Peu importe",{}]]],
  ["Quel âge ?",[["Jeune",{ag:'jeune'}],["Adulte",{ag:'adulte'}],["Senior",{ag:'senior'}],["Peu importe",{}]]],
  ["Quel caractère ?",[["Calme",{ch:'calme'}],["Joueur",{ch:'joueur'}],["Affectueux",{ch:'affectueux'}],["Curieux",{ch:'curieux'}],["Peu importe",{}]]],
  ["Votre situation ?",[["J'ai des enfants",{so:'enfants'}],["J'ai déjà des animaux",{so:'groupe'}],["Pas d'autre animal",{so:'seul'}]]]]}
];
const TRAIT_TXT={calme:"Un compagnon paisible, qui aime les routines.",joueur:"Un compagnon plein d'énergie qui vous fera bouger.",affectueux:"Un câlin sur pattes, très attaché à l'humain.",indépendant:"Un tempérament libre qui vient vers vous quand il le décide.",curieux:"Un explorateur qui s'intéresse à tout.",protecteur:"Un gardien fidèle, attentif à sa famille.",sociable:"Un compagnon ouvert, à l'aise avec tout le monde.",timide:"Un sensible qui demande de la patience, et la rend au centuple."};
