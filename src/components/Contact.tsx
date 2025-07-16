import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Contact: React.FC = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    sujet: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simuler l'envoi du formulaire
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
    setFormData({
      nom: '',
      email: '',
      telephone: '',
      sujet: '',
      message: ''
    });
  };

  const sujets = [
    'Inscription à un cours',
    'Demande d\'information',
    'Consultation pédagogique',
    'Cours particuliers',
    'Partenariat',
    'Autre'
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{t('contact.title')}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            N'hésitez pas à me contacter pour toute question ou pour discuter de vos besoins d'apprentissage
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations de Contact</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Phone className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Téléphone</h3>
                    <p className="text-gray-600">+33 (0)1 23 45 67 89</p>
                    <p className="text-sm text-gray-500 mt-1">Lundi - Vendredi, 9h - 18h</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">mounir.benyahia@exemple.com</p>
                    <p className="text-sm text-gray-500 mt-1">Réponse sous 24h</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <MapPin className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Adresse</h3>
                    <p className="text-gray-600">Casablanca</p>
                    <p className="text-gray-600">Maroc</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Clock className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Horaires</h3>
                    <p className="text-gray-600">Lundi - Vendredi: 14h - 18h</p>
                    <p className="text-gray-600">Samedi: 9h - 12h</p>
                    <p className="text-gray-600">Dimanche: Sur rendez-vous</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl p-8 text-white mt-8">
              <h3 className="text-xl font-bold mb-4">WhatsApp</h3>
              <div className="space-y-3">
                <button
                  onClick={() => window.open('https://wa.me/212123456789?text=Bonjour%20Mounir,%20je%20souhaite%20avoir%20des%20informations%20sur%20vos%20cours%20de%20soutien%20scolaire.', '_blank')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>📱</span>
                  <span>{t('contact.whatsapp')}</span>
                </button>
                <p className="text-blue-100 text-sm text-center">
                  Réponse rapide garantie
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Envoyez-moi un message</h2>
              
              {isSubmitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-green-800">Votre message a été envoyé avec succès ! Je vous répondrai dans les plus brefs délais.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="06 12 34 56 78"
                    />
                  </div>

                  <div>
                    <label htmlFor="sujet" className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet *
                    </label>
                    <select
                      id="sujet"
                      name="sujet"
                      value={formData.sujet}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    >
                      <option value="">Choisir un sujet</option>
                      {sujets.map((sujet) => (
                        <option key={sujet} value={sujet}>{sujet}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    placeholder="Décrivez votre demande en détail..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="consent"
                    required
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="consent" className="ml-2 text-sm text-gray-700">
                    J'accepte que mes données soient utilisées pour me recontacter concernant ma demande *
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto bg-blue-700 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors duration-200 font-medium flex items-center justify-center"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-96 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Localisation</h3>
              <p className="text-gray-600">Casablanca, Maroc</p>
              <p className="text-sm text-gray-500 mt-2">Carte interactive bientôt disponible</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;