import random
import os
import datetime
import pandas as pd
from config import COURS, FICHIER_CSV, FICHIER_DIPLOMES
from model import charger_donnees

def afficher_etudiants(df=None):
    """Affiche tous les étudiants triés par étape en priorité."""
    if df is None:
        df = charger_donnees()
    if df.empty:
        print("\nAucun étudiant dans la base.")
        return

    df_trie = df.sort_values(by=["Etape", "Nom"], ascending=[True, True])
    print("\n" + "="*85)
    print(f"{'ID':<10} | {'Prénom':<12} | {'Nom':<15} | {'Étape':<8} | {'Moyenne Actuelle':<15}")
    print("="*85)
    for _, row in df_trie.iterrows():
        print(f"{str(row['Num_Etudiant']):<10} | {str(row['Prenom']):<12} | {str(row['Nom']):<15} | {str(row['Etape']):<8} | {str(row['Moyenne_Actuelle'])+' %':<15}")
    print("="*85)

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
        try:
            moyenne = float(row.get("Moyenne_Actuelle", 0))
        except ValueError:
            moyenne = 0.0
            
        etape_actuelle = str(row["Etape"])
        print(f"Étudiant : {row['Prenom']} {row['Nom']} (Étape {etape_actuelle}) - Moyenne : {moyenne}%")
        
        if moyenne >= 65.0:
            if etape_actuelle in ["1", "2", "3"]:
                nouvelle_etape = str(int(etape_actuelle) + 1)
                df.at[idx, "Etape"] = nouvelle_etape
                
                liste_matieres = COURS.get(nouvelle_etape, [])
                notes_par_matiere = {m: 0.0 for m in liste_matieres}
                
                df.at[idx, "Cours et Notes actuels"] = str(notes_par_matiere)
                df.at[idx, "Moyenne_Actuelle"] = 0.0
                print(f"  -> Validé ! Passage à l'étape {nouvelle_etape} (notes initialisées à 0).")
                
            elif etape_actuelle == "4":
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

    if indices_a_supprimer:
        df = df.drop(indices_a_supprimer).reset_index(drop=True)
        print(f"\n{len(indices_a_supprimer)} étudiant(s) diplômé(s) retiré(s) de la base active.")
        
        if os.path.exists(FICHIER_DIPLOMES):
            df_dip_exist = pd.read_csv(FICHIER_DIPLOMES, encoding="latin-1")
            df_diplomes = pd.concat([df_dip_exist, pd.DataFrame(diplomes_recents)], ignore_index=True)
        else:
            df_diplomes = pd.DataFrame(diplomes_recents)
        df_diplomes.to_csv(FICHIER_DIPLOMES, index=False, encoding="latin-1")

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