import React from 'react';
import { GraduationCap, Heart, Globe, BookOpen } from 'lucide-react';

const APropos: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">À Propos</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez mon parcours, mes valeurs et mon engagement envers l'enseignement des sciences islamiques
          </p>
        </div>

        {/* Biography Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Mon Parcours</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Enseignant retraité avec plus de 30 années d'expérience dans l'enseignement primaire, 
                je me consacre maintenant au soutien scolaire avec passion et expertise pédagogique.
              </p>
              <p>
                Mon parcours professionnel m'a permis d'acquérir une expertise approfondie des programmes 
                nationaux et des missions éducatives, ainsi que la maîtrise des nouvelles pédagogies.
              </p>
              <p>
                J'ai eu l'honneur d'accompagner plus de 3000 élèves du primaire, adaptant constamment 
                ma pédagogie pour répondre aux besoins spécifiques de chaque enfant.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <img 
              src="https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Mounir Ben Yahia enseignant"
              className="w-full max-w-md rounded-xl shadow-xl"
            />
          </div>
        </div>

        {/* Experience Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Expérience & Diplômes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Formation Académique</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Diplôme d'Enseignement Primaire</li>
                <li>• Formation en Nouvelles Pédagogies</li>
                <li>• Certification en Langue Arabe</li>
                <li>• Formation continue en Techniques Innovantes</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-8 rounded-xl">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Expérience Professionnelle</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 30+ années d'enseignement primaire</li>
                <li>• 3000+ élèves accompagnés avec succès</li>
                <li>• Spécialiste en soutien scolaire personnalisé</li>
                <li>• Expert en langue arabe et programmes nationaux</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Mes Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Bienveillance</h3>
              <p className="text-gray-600">
                Créer un environnement d'apprentissage chaleureux et respectueux où chaque étudiant se sent valorisé.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Ouverture</h3>
              <p className="text-gray-600">
                Encourager le dialogue interculturel et l'adaptation des enseignements au contexte contemporain.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Authenticité</h3>
              <p className="text-gray-600">
                Enseigner avec fidélité aux sources authentiques tout en rendant les concepts accessibles.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Mon Engagement</h2>
          <p className="text-xl mb-8 max-w-4xl mx-auto">
            "Avec plus de 30 années d'expérience dans l'enseignement primaire et 3000+ élèves accompagnés, 
            mon objectif est d'offrir un soutien scolaire de qualité en utilisant les nouvelles pédagogies 
            et techniques innovantes. Je m'engage à améliorer le niveau d'apprentissage de chaque enfant 
            avec bienveillance et professionnalisme."
          </p>
          <div className="text-2xl font-bold">- Mounir Ben Yahia</div>
        </div>
      </div>
    </div>
  );
};

export default APropos;