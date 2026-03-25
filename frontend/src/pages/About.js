import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#0f2e24] py-24 px-8 md:px-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm font-['Bricolage_Grotesque'] hover:underline mb-12 inline-flex items-center gap-2">&larr; Back to Home</Link>

        <h1 className="font-['Libre_Baskerville'] text-5xl md:text-6xl mb-8 leading-tight">Our Story</h1>
        <p className="font-['Bricolage_Grotesque'] text-xl leading-relaxed mb-8 font-medium">Assalamualaikum. Welcome to Alif Amin Academy.</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">The Origin</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">Alif Amin was born from a simple belief shared by two siblings: the world becomes a better place when people can learn The Quran at their own pace and on their own time. As life gets busier every day, finding moments of spiritual connection can feel difficult. We built this platform to provide the luxury of accessible, dedicated Quran learning for the modern lifestyle.</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">The Mission</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">We noticed a growing challenge in the modern world. Students were struggling to find qualified, reliable Quran tutors locally, while incredibly gifted teachers lacked a platform to reach eager learners globally. Our mission is simple: to illuminate homes with the light of the Quran by connecting students with expert tutors through a seamless, high-quality online experience. We are more than an app; we are a global community connecting hearts through knowledge.</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">How We Work</h2>
        <div className="grid md:grid-cols-2 gap-8 my-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="font-['Bricolage_Grotesque'] text-xl font-bold mb-4">For Students</h3>
            <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85">We offer a personalized learning path. Whether you are a parent looking for a patient guide for your child, or an adult seeking to refine your Tajweed, we connect you with vetted professionals who match your specific needs.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="font-['Bricolage_Grotesque'] text-xl font-bold mb-4">For Teachers</h3>
            <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85">We are committed to empowering you. We handle the administrative heavy lifting&mdash;scheduling, payments, and tracking&mdash;so you can focus on teaching. We ensure you are compensated fairly, turning your knowledge into a sustainable livelihood.</p>
          </div>
        </div>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">Why Choose AlifAmin?</h2>
        <ul className="space-y-4 mb-12">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Uncompromised Quality:</strong> Every tutor undergoes a strict verification process. When you choose a tutor here, you are choosing excellence.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>True Flexibility:</strong> Book sessions that fit your time zone and busy life. Learn from the comfort of your home, without the commute.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Total Peace of Mind:</strong> We provide a secure environment for payments and communication, giving you absolute safety.</li>
        </ul>

        <div className="text-center mt-24 border-t border-[#0f2e24]/10 pt-16">
          <p className="font-['Libre_Baskerville'] text-2xl md:text-3xl leading-relaxed italic mb-8">&ldquo;We envision a world where anyone, anywhere, can access the divine wisdom of the Quran with a single click. Where technology serves tradition. Where every teacher is valued... and every student is inspired.&rdquo;</p>
          <p className="font-['Bricolage_Grotesque'] font-bold text-xl">AlifAmin.com &mdash; Students Learn. Teachers Earn.</p>
        </div>
      </div>
    </div>
  );
}
