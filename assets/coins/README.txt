COMMENT AJOUTER UN VISUEL DE PIÈCE
===================================

1. Crée un sous-dossier ici, dans assets/coins/, nommé comme tu veux
   (ex: assets/coins/dragon/).

2. Mets-y deux images carrées, idéalement en PNG avec fond transparent,
   environ 512x512 px, nommées exactement :
     - pile.png   (le côté "PILE")
     - face.png   (le côté "FACE")

3. Ouvre assets/coins/coins.json et ajoute une entrée à la liste, par ex :

   {
     "id": "dragon",
     "label": "Pièce dragon",
     "type": "image",
     "front": "assets/coins/dragon/pile.png",
     "back": "assets/coins/dragon/face.png"
   }

   - "id"    : identifiant unique (sans espace)
   - "label" : nom affiché dans le sélecteur
   - "front" : image du côté PILE
   - "back"  : image du côté FACE

4. Envoie sur GitHub (ou ton hébergeur) le dossier assets/coins/ complet
   (sous-dossier + coins.json mis à jour). Aucune autre modification de
   code n'est nécessaire : le sélecteur de pièce lit ce fichier JSON
   automatiquement et propose toutes les entrées qu'il contient.

L'entrée "classique" (texte PILE/FACE, sans image) reste toujours
disponible et ne doit pas être supprimée du fichier.
