// ...existing code...
import { Eleve, Classe, Matiere, Enseignant, FraisScolaire, Ecole, Utilisateur, HistoriqueAction } from '../types';

class LocalDatabase {
  private static instance: LocalDatabase;
  
  private constructor() {
    this.initializeDefaultData();
  }

  // Historique des actions
  addHistorique(action: Omit<HistoriqueAction, 'id' | 'date'>) {
    const historiques = this.getAll<HistoriqueAction>('historiques');
    const newAction: HistoriqueAction = {
      ...action,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      date: new Date().toISOString(),
    };
    historiques.push(newAction);
    localStorage.setItem('historiques', JSON.stringify(historiques));
    return newAction;
  }

  static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  private initializeDefaultData() {
    // Initialiser toutes les collections vides
    const collections = [
      'ecole', 'matieres', 'classes', 'enseignants', 'fraisScolaires',
      'eleves', 'paiements', 'notes', 'moyennesGenerales', 'utilisateurs',
      'compositions', 'historiques'
    ];
    
    collections.forEach(collection => {
      if (!localStorage.getItem(collection)) {
        localStorage.setItem(collection, JSON.stringify([]));
      }
    });

    // Utilisateur admin par défaut
    if (!localStorage.getItem('utilisateurs')) {
      const adminDefaut: Utilisateur = {
        id: '1',
        nom: 'ADMIN',
        prenoms: 'Système',
        nomUtilisateur: 'admin',
        role: 'Admin',
        actif: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('utilisateurs', JSON.stringify([adminDefaut]));
    }

    // École par défaut si pas configurée
    if (!localStorage.getItem('ecole') || JSON.parse(localStorage.getItem('ecole') || '[]').length === 0) {
      const ecoleDefaut: Omit<Ecole, 'id' | 'createdAt' | 'updatedAt'> = {
        nom: 'École Primaire Excellence',
        codeEtablissement: 'EPE2025',
        adresse: 'Abidjan, Côte d\'Ivoire',
        telephone: '+225 XX XX XX XX XX',
        email: 'contact@ecole.ci',
        logo: '',
        devise: 'FCFA',
        anneeScolaireActive: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        compositions: []
      };
      this.create('ecole', ecoleDefaut);
    }
  }

  // Méthodes génériques
  getAll<T>(collection: string): T[] {
    try {
      const data = localStorage.getItem(collection);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Erreur lors du chargement de ${collection}:`, error);
      return [];
    }
  }

  getById<T extends { id: string }>(collection: string, id: string): T | null {
    const items = this.getAll<T>(collection);
    return items.find(item => item.id === id) || null;
  }

  create<T extends { id: string }>(collection: string, item: Omit<T, 'id' | 'createdAt'>) {
    const items = this.getAll<T>(collection);
    const newItem = Object.assign({}, item, {
      id: this.generateId(),
      createdAt: new Date().toISOString()
    }) as unknown as T;
    items.push(newItem);
    localStorage.setItem(collection, JSON.stringify(items));
    return newItem;
  }

  update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>) {
    const items = this.getAll<T>(collection);
    const index = items.findIndex(item => item.id === id);
    
    if (index !== -1) {
      items[index] = { 
        ...items[index], 
        ...updates,
        updatedAt: new Date().toISOString()
      } as T;
      localStorage.setItem(collection, JSON.stringify(items));
      return items[index];
    }
    return null;
  }

  delete(collection: string, id: string): boolean {
    const items = this.getAll<{ id: string }>(collection);
    const filteredItems = items.filter(item => item.id !== id);
    if (filteredItems.length !== items.length) {
      localStorage.setItem(collection, JSON.stringify(filteredItems));
      return true;
    }
    return false;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Méthodes spécifiques pour le matricule auto
  generateMatricule(): string {
    const eleves = this.getAll<Eleve>('eleves');
    const annee = new Date().getFullYear().toString().substr(2, 2);
    const numero = (eleves.length + 1).toString().padStart(4, '0');
    return `${annee}${numero}`;
  }

  // Recherche et filtrage
  search<T>(collection: string, searchTerm: string, fields: (keyof T)[]): T[] {
    const items = this.getAll<T>(collection);
    if (!searchTerm) return items;

    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      fields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      })
    );
  }

  // Exportation de toutes les données
  exportData(): string {
    const collections = [
      'ecole',
      'matieres',
      'classes',
      'enseignants',
      'eleves',
      'fraisScolaires',
      'paiements',
      'notes',
      'moyennesGenerales',
      'utilisateurs',
      'compositions',
      'historiques'
    ];

    const data: Record<string, any> = {};
    collections.forEach(collection => {
      data[collection] = this.getAll(collection);
    });

    return JSON.stringify(data, null, 2);
  }

  // Importation des données
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([collection, items]) => {
        localStorage.setItem(collection, JSON.stringify(items));
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'importation des données:', error);
      return false;
    }
  }

  // Réinitialisation des données
  resetData(): void {
    localStorage.clear();
    this.initializeDefaultData();
  }
}

export const db = LocalDatabase.getInstance();