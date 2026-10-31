import os
import random
import json
import pandas as pd
from config import FICHIER_CSV, COURS, Prenoms, Noms

FICHIER_JSON = "etudiants.json"

def exporter_json(df):
    """Exporte le DataFrame au format JSON pour alimenter dynamiquement le front-end HTML/JS."""
    etudiants_json = []
    
    for _, row in df.iterrows():
        try:
            # Reconstitution de l'historique pour le visuel web
            notes_dict = eval(row["Cours et Notes actuels"]) if isinstance(row["Cours et Notes actuels"], str) else row["Cours et Notes actuels"]
        except Exception:
            notes_dict = {}

        etape = int(row["Etape"])
        etudiant_obj = {
            "id": int(row["Num_Etudiant"]),
            "firstname": str(row["Prenom"]),
            "lastname": str(row["Nom"]),
            "currentStage": etape,
            "history": {
                str(etape): notes_dict
            }
        }
        etudiants_json.append(etudiant_obj)
        
    with open(FICHIER_JSON, "w", encoding="utf-8") as f:
        json.dump(etudiants_json, f, ensure_ascii=False, indent=4)
    print("Export vers etudiants.json réussi !")

def creer_etudiants():
    """Crée une liste initiale de 21 étudiants sous forme de DataFrame Pandas."""
    liste_etudiants = []
    index = 300000
    for i in range(21):
        etudiant = {}
        etudiant["Num_Etudiant"] = index + i
        etudiant["Prenom"] = random.choice(Prenoms)
        etudiant["Nom"] = random.choice(Noms)
        
        etape = str(random.randint(1, 4))
        etudiant["Etape"] = etape

        notes_par_matiere = {}
        liste_matieres = COURS.get(etape, [])
        
        somme_notes = 0
        for m in liste_matieres:
            note_val = round(random.gauss(75, 8), 2)
            note_val = max(0.0, min(100.0, note_val))
            notes_par_matiere[m] = note_val
            somme_notes += note_val
            
        etudiant["Cours et Notes actuels"] = notes_par_matiere
        etudiant["Moyenne_Actuelle"] = round(somme_notes / len(liste_matieres), 2) if liste_matieres else 0.0
        
        liste_etudiants.append(etudiant)
        
    bd = pd.DataFrame(liste_etudiants)
    bd.to_csv(FICHIER_CSV, index=False, encoding="latin-1")
    exporter_json(bd)  # Export automatique vers JSON
    return bd

def charger_donnees():
    """Charge les données depuis le CSV, ou les crée si le fichier n'existe pas."""
    if os.path.exists(FICHIER_CSV):
        df = pd.read_csv(FICHIER_CSV, encoding="latin-1")
        exporter_json(df)
        return df
    else:
        return creer_etudiants()

def enregistrer(df):
    """Sauvegarde le DataFrame dans le CSV et met à jour le JSON."""
    df.to_csv(FICHIER_CSV, index=False, encoding="latin-1")
    exporter_json(df)
    print("Données enregistrées avec succès. Au revoir !")