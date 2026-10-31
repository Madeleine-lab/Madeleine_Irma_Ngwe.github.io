import os

# Fichiers de données
FICHIER_PRENOMS = "Firstnames.txt"
FICHIER_NOMS = "Lastnames.txt"
FICHIER_CSV = "Etudiants.csv"
FICHIER_DIPLOMES = "Diplomes.csv"

# Chargement des prénoms et noms
def charger_noms_prenoms():
    try:
        with open(FICHIER_PRENOMS, "rt", encoding="latin-1") as f:
            prenoms = [ligne.strip() for ligne in f if ligne.strip()]
        with open(FICHIER_NOMS, "rt", encoding="latin-1") as f:
            noms = [ligne.strip() for ligne in f if ligne.strip()]
        return prenoms, noms
    except FileNotFoundError:
        return ["Jean", "Marie"], ["Dupont", "Martin"]

Prenoms, Noms = charger_noms_prenoms()

# Génération des étapes et des cours associés
COURS = {
    "1": ["Maths", "Anglais", "Francais"],
    "2": ["Info", "SD", "Maths A."],
    "3": ["BD", "Programmation", "Stats"],
    "4": ["SGBD", "Programmation A.", "Stats A."]
}