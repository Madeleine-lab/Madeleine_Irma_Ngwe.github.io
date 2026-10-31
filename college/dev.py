from model import charger_donnees, enregistrer
from service import (
    afficher_etudiants, 
    passer_semestre, 
    inscrire_etudiant, 
    retirer_etudiant, 
    chercher_etudiant
)

def main():
    df = charger_donnees()
    
    while True:
        print("\n==================================================")
        print(" 1 : Afficher les étudiants")
        print(" 2 : Nouveau Semestre")
        print(" 3 : Inscrire un étudiant")
        print(" 4 : Retirer un étudiant")
        print(" 5 : Chercher un étudiant")
        print(" 6 : Enregistrer et quitter")
        print("===================================================")
        
        reply = input(">> ").strip()
        
        if reply == "1":
            afficher_etudiants(df)
        elif reply == "2":
            df = passer_semestre(df)
        elif reply == "3":
            df = inscrire_etudiant(df)
        elif reply == "4":
            df = retirer_etudiant(df)
        elif reply == "5":
            chercher_etudiant(df)
        elif reply == "6":
            enregistrer(df)
            break
        else:
            print("Option inconnue. Veuillez choisir entre 1 et 6.")
        print()

if __name__ == "__main__":
    main()