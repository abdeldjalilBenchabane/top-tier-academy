import React from "react";
import { cards } from "../data/index";

const Cards = () => {

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-center mb-12 text-[#2F327D]">
        كيف تعمل <span className="text-cyan-400">منصتنا</span>
      </h2>
      <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
        تقدم منصة التعلم الإلكتروني دروسًا تفاعلية عبر الإنترنت مع اختبارات تقييمية، مما يتيح للطلاب التعلم في أي وقت
        ومن أي مكان، ويساهم في تحسين جودة التعليم وتوفير الوقت والجهد
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-lg overflow-hidden relative hover:transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
          >
            <div className={`absolute top-0 left-0 w-20 h-1 ${card.color}`}></div>
            <div className={`absolute bottom-0 right-0 w-20 h-1 ${card.color}`}></div>
            <div className="p-6 pt-8 flex flex-col items-end text-right">
              <div className="">
                <div className="flex bg-gray-100 rounded-full w-14 h-14 items-center mb-4">
                  <card.IconComponent className={`text-5xl opacity-100 ${card.iconColor} p-2 `} />
                </div>
              </div>
              <h3 className="text-xl  font-bold mb-4 text-gray-800">
                {card.title}
              </h3>
              <p className="text-gray-600 mb-2">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cards;
