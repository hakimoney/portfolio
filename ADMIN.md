# Administration du portfolio

Ouvrez `admin.html` (ou `index.html?admin=1`) depuis le même domaine que le portfolio.

## Utilisation

1. Cliquez sur un élément du portfolio.
2. Modifiez son texte, son URL, son image ou son identifiant dans le panneau.
3. Utilisez les actions pour déplacer, dupliquer ou supprimer l’élément.
4. Ajoutez au besoin un texte, un lien, une image ou une section.
5. Cliquez sur **Enregistrer**.

Les données sont enregistrées dans le `localStorage` du navigateur. Elles n’affectent donc que ce navigateur et ce domaine. Utilisez **Exporter JSON** pour conserver une sauvegarde et **Importer JSON** pour la restaurer sur un autre navigateur.

## Publication

Cette version reste compatible avec un hébergement statique comme GitHub Pages. Pour partager automatiquement les modifications avec tous les visiteurs, il faudra connecter le CMS à une base de données et ajouter une authentification côté serveur (par exemple Supabase, Firebase ou une API dédiée). Une simple page statique ne peut pas protéger réellement un mot de passe administrateur.
