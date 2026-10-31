import random
import pandas as pd
import os

# Fichiers de données
FICHIER_PRENOMS = "Firstnames.txt"
FICHIER_NOMS = "Lastnames.txt"
FICHIER_CSV = "Etudiants.csv"

# Chargement des prénoms et noms
def charger_noms_prenoms():
    try:
        with open(FICHIER_PRENOMS, "rt", encoding="latin-1") as f:
            prenoms = [ligne.strip() for ligne in f if ligne.strip()]
        with open(FICHIER_NOMS, "rt", encoding="latin-1") as f:
            noms = [ligne.strip() for ligne in f if ligne.strip()]
        return prenoms, noms
    except FileNotFoundError:
        # Fallback si les fichiers externes manquent
        return ["Jean", "Marie"], ["Dupont", "Martin"]

Prenoms, Noms = charger_noms_prenoms()

# Génération des étapes et des cours associés
COURS = {
    "1": ["Maths", "Anglais", "Francais"],
    "2": ["Info", "SD", "Maths A."],
    "3": ["BD", "Programmation", "Stats"],
    "4": ["SGBD", "Programmation A.", "Stats A."]
}

def creer_etudiants():
    """Crée une liste initiale de 21 étudiants sous forme de DataFrame Pandas."""
    liste_etudiants = []
    index = 300000
    for i in range(21):
        etudiant = {}
        etudiant["Num_Etudiant"] = index + i
        etudiant["Prenom"] = random.choice(Prenoms)
        etudiant["Nom"] = random.choice(Noms)
        
        # Etape sous forme de chaîne pour correspondre au dictionnaire COURS
        etape = str(random.randint(1, 4))
        etudiant["Etape"] = etape

        notes_par_matiere = {}
        liste_matieres = COURS.get(etape, [])
        
        somme_notes = 0
        for m in liste_matieres:
            note_val = round(random.gauss(75, 8), 2)
            # S'assurer que la note reste dans des bornes réalistes (0-100)
            note_val = max(0.0, min(100.0, note_val))
            notes_par_matiere[m] = note_val
            somme_notes += note_val
            
        etudiant["Cours et Notes actuels"] = notes_par_matiere
        etudiant["Moyenne_Actuelle"] = round(somme_notes / len(liste_matieres), 2) if liste_matieres else 0.0
        
        liste_etudiants.append(etudiant)
        
    bd = pd.DataFrame(liste_etudiants)
    bd.to_csv(FICHIER_CSV, index=False, encoding="latin-1")
    return bd

def charger_donnees():
    """Charge les données depuis le CSV, ou les crée si le fichier n'existe pas."""
    if os.path.exists(FICHIER_CSV):
        return pd.read_csv(FICHIER_CSV, encoding="latin-1")
    else:
        return creer_etudiants()

def afficher_etudiants(df=None):
    """Affiche tous les étudiants ou filtre par étape."""
    if df is None:
        df = charger_donnees()
    print("\n--- LISTE DES ETUDIANTS ---")
    print(df.to_string(index=False))

import datetime

def passer_semestre(df):
    """Fait progresser les étudiants si leur moyenne est >= 65%.
    - Étapes 1 à 3 : Passage à l'étape suivante avec des notes initialisées à 0.0.
    - Étape 4 : Validation et ajout à la liste des diplômés avec date (retrait de la base active).
    """
    print("\n--- PASSAGE DE SEMESTRE ---")
    if df.empty:
        print("Aucun étudiant dans la base.")
        return df

    indices_a_supprimer = []
    diplomes_recents = []

    for idx, row in df.iterrows():
        moyenne = float(row.get("Moyenne_Actuelle", 0))
        etape_actuelle = str(row["Etape"])
        
        print(f"Étudiant : {row['Prenom']} {row['Nom']} (Étape {etape_actuelle}) - Moyenne : {moyenne}%")
        
        if moyenne >= 65.0:
            if etape_actuelle in ["1", "2", "3"]:
                nouvelle_etape = str(int(etape_actuelle) + 1)
                df.at[idx, "Etape"] = nouvelle_etape
                
                # Cours de la nouvelle étape initialisés à 0.0 car non commencés
                liste_matieres = COURS.get(nouvelle_etape, [])
                notes_par_matiere = {m: 0.0 for m in liste_matieres}
                
                df.at[idx, "Cours et Notes actuels"] = str(notes_par_matiere)
                df.at[idx, "Moyenne_Actuelle"] = 0.0
                print(f"  -> Validé ! Passage à l'étape {nouvelle_etape} (notes initialisées à 0).")
                
            elif etape_actuelle == "4":
                # Diplômé de niveau 4
                date_obtention = datetime.date.today().strftime("%Y-%m-%d")
                print(f"  -> DIPLÔMÉ ! Étape 4 validée le {date_obtention}.")
                
                diplomes_recents.append({
                    "Num_Etudiant": row["Num_Etudiant"],
                    "Prenom": row["Prenom"],
                    "Nom": row["Nom"],
                    "Date_Diplome": date_obtention
                })
                indices_a_supprimer.append(idx)
        else:
            print("  -> Échoué (Moyenne < 65%). Reste à la même étape.")

    # Retirer les diplômés de la base active
    if indices_a_supprimer:
        df = df.drop(indices_a_supprimer).reset_index(drop=True)
        print(f"\n{len(indices_a_supprimer)} étudiant(s) diplômé(s) retiré(s) de la base active.")
        
        # Optionnel : Sauvegarder les diplômés dans un fichier CSV dédié
        df_diplomes_path = "Diplomes.csv"
        if os.path.exists(df_diplomes_path):
            df_dip_exist = pd.read_csv(df_diplomes_path, encoding="latin-1")
            df_diplomes = pd.concat([df_dip_exist, pd.DataFrame(diplomes_recents)], ignore_index=True)
        else:
            df_diplomes = pd.DataFrame(diplomes_recents)
        df_diplomes.to_csv(df_diplomes_path, index=False, encoding="latin-1")

    df.to_csv(FICHIER_CSV, index=False, encoding="latin-1")
    print("\nSemestre validé et mis à jour avec succès !")
    return df

def inscrire_etudiant(df):
    """Inscrit un nouvel étudiant."""
    print("\n--- INSCRIRE UN ETUDIANT ---")
    prenom = input("Prénom de l'étudiant : ")
    nom = input("Nom de l'étudiant : ")
    etape = input("Étape (1 à 4) : ")
    
    if etape not in COURS:
        etape = "1"
        
    nouvel_id = int(df["Num_Etudiant"].max()) + 1 if not df.empty else 300000
    
    notes_par_matiere = {}
    liste_matieres = COURS.get(etape, [])
    somme = 0
    for m in liste_matieres:
        n = round(random.gauss(75, 8), 2)
        notes_par_matiere[m] = n
        somme += n
        
    moyenne = round(somme / len(liste_matieres), 2) if liste_matieres else 0.0
    
    nouvelle_ligne = {
        "Num_Etudiant": nouvel_id,
        "Prenom": prenom,
        "Nom": nom,
        "Etape": etape,
        "Cours et Notes actuels": str(notes_par_matiere),
        "Moyenne_Actuelle": moyenne
    }
    
    df = pd.concat([df, pd.DataFrame([nouvelle_ligne])], ignore_index=True)
    print(f"Étudiant {prenom} {nom} inscrit avec succès !")
    return df

def retirer_etudiant(df):
    """Retire un étudiant par son numéro."""
    print("\n--- RETIRER UN ETUDIANT ---")
    try:
        num = int(input("Entrez le Numéro de l'étudiant à retirer : "))
        if num in df["Num_Etudiant"].values:
            df = df[df["Num_Etudiant"] != num]
            print(f"Étudiant {num} supprimé.")
        else:
            print("Aucun étudiant trouvé avec ce numéro.")
    except ValueError:
        print("Entrée invalide.")
    return df

def chercher_etudiant(df):
    """Cherche un étudiant par son nom ou son numéro."""
    print("\n--- RECHERCHER UN ETUDIANT ---")
    terme = input("Entrez le nom ou le numéro de l'étudiant : ").lower()
    resultat = df[df['Nom'].str.lower().str.contains(terme, na=False) | df['Num_Etudiant'].astype(str).str.contains(terme)]
    if not resultat.empty:
        print(resultat.to_string(index=False))
    else:
        print("Aucun étudiant trouvé.")

def enregistrer(df):
    """Sauvegarde le DataFrame dans le fichier CSV."""
    df.to_csv(FICHIER_CSV, index=False)
    print("Données enregistrées avec succès. Au revoir !")