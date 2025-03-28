"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import {
  BluetoothDevice,
  BluetoothRemoteGATTCharacteristic,
} from "@/types/global";
type ErrorCode = {
  code: string;
  description: string;
  category: string;
};
export default function CarDiagnosticSystem() {
  const [status, setStatus] = useState("جاهز للاتصال");
  const [errorCodes, setErrorCodes] = useState<ErrorCode[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(true);
  // قاعدة بيانات كاملة لأكواد الأعطال
  const errorDatabase: Record<
    string,
    { description: string; category: string }
  > = {
    P0300: {
      description: "خلل اشتعال عشوائي في عدة أسطوانات",
      category: "ignition",
    },
    P0301: { description: "خلل اشتعال في الأسطوانة 1", category: "ignition" },
    P0171: { description: "خلطة وقود فقيرة (بنك 1)", category: "fuel" },
    P0172: { description: "خلطة وقود غنية (بنك 1)", category: "fuel" },
    P0420: {
      description: "كفاءة المحول الحفاز منخفضة (بنك 1)",
      category: "emission",
    },
    P0100: {
      description: "خلل في دائرة حساس تدفق الهواء",
      category: "sensors",
    },
    P0700: {
      description: "عطل عام في نظام ناقل الحركة",
      category: "transmission",
    },
    B1000: {
      description: "عطل عام في نظام الوسائد الهوائية",
      category: "electrical",
    },
    C1201: {
      description: "خلل في نظام منع الانزلاق (ABS)",
      category: "brakes",
    },
    U0100: {
      description: "فقدان الاتصال مع وحدة التحكم في المحرك",
      category: "electrical",
    },
    P0125: {
      description: "زمن غير كاف للوصول لدرجة حرارة التشغيل",
      category: "cooling",
    },
    P0217: {
      description: "ارتفاع حرارة المحرك عن الحد المسموح",
      category: "cooling",
    },
    C1300: { description: "خلل في حساس زاوية المقود", category: "brakes" },
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !navigator.bluetooth) {
      setIsBluetoothSupported(false);
      setStatus("المتصفح لا يدعم تقنية Web Bluetooth");
    }
  }, []);

  const connectToDevice = async () => {
    try {
      if (!navigator.bluetooth) {
        setStatus("المتصفح لا يدعم تقنية Web Bluetooth");
        return;
      }

      setStatus("جاري البحث عن جهاز التشخيص...");

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["generic_access", "device_information", "fff0"],
      });

      setDevice(device as BluetoothDevice);
      setStatus(`متصل بـ: ${device.name || "جهاز غير معروف"}`);

      if (!device.gatt) {
        throw new Error("لا يدعم الجهاز اتصال GATT");
      }

      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();

          for (const char of characteristics) {
            if (char.properties.notify) {
              await char.startNotifications();
              char.addEventListener("characteristicvaluechanged", (event) => {
                const target =
                  event.target as BluetoothRemoteGATTCharacteristic;
                const value = target.value;
                if (!value) return;

                const decoder = new TextDecoder();
                const data = decoder.decode(value);

                const codes = data.match(/\b[PBCU]\d{4}\b/g) || [];

                codes.forEach((code) => {
                  if (
                    errorDatabase[code] &&
                    !errorCodes.some((e) => e.code === code)
                  ) {
                    setErrorCodes((prev) => [
                      ...prev,
                      {
                        code,
                        description: errorDatabase[code].description,
                        category: errorDatabase[code].category,
                      },
                    ]);
                  }
                });
              });
              setStatus("جاري استقبال البيانات...");
            }
          }
        } catch (e) {
          console.warn("Error reading characteristic:", e);
        }
      }

      device.addEventListener("gattserverdisconnected", () => {
        setStatus("تم قطع الاتصال بالجهاز");
        setDevice(null);
      });
    } catch (error) {
      setStatus(
        `خطأ: ${error instanceof Error ? error.message : "حدث خطأ غير معروف"}`
      );
      console.error("Connection error:", error);
    }
  };

  const disconnectDevice = () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
      setStatus("تم قطع الاتصال");
      setDevice(null);
    }
  };

  const clearCodes = () => {
    setErrorCodes([]);
    setStatus("تم مسح الأكواد");
  };

  const filteredCodes =
    activeTab === "all"
      ? errorCodes
      : errorCodes.filter((code) => code.category === activeTab);

  function getTabName(tab: string): string {
    const names: Record<string, string> = {
      all: "جميع الأعطال",
      ignition: "مشاكل الاشتعال",
      fuel: "نظام الوقود",
      emission: "الانبعاثات",
      sensors: "حساسات المحرك",
      transmission: "ناقل الحركة",
      electrical: "أنظمة الكهرباء",
      cooling: "نظام التبريد",
      brakes: "الفرامل والثبات",
    };
    return names[tab] || tab;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4">
      <Head>
        <title>نظام تشخيص أعطال السيارات</title>
        <meta
          name="description"
          content="نظام تشخيص أعطال السيارات عبر Bluetooth"
        />
      </Head>

      <h1 className="text-3xl font-bold text-center my-6">
        نظام تشخيص أعطال السيارات
      </h1>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        {!isBluetoothSupported && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>تنبيه:</strong> متصفحك لا يدعم اتصال Bluetooth. يرجى
            استخدام:
            <ul className="list-disc mr-4 mt-2">
              <li>Chrome على أندرويد/ويندوز/ماك</li>
              <li>Edge على أندرويد/ويندوز/ماك</li>
            </ul>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={connectToDevice}
            disabled={!isBluetoothSupported || !!device}
            className={`bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 ${
              !isBluetoothSupported || device
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            الاتصال بالجهاز
          </button>

          {device && (
            <button
              onClick={disconnectDevice}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
            >
              قطع الاتصال
            </button>
          )}

          <button
            onClick={clearCodes}
            disabled={errorCodes.length === 0}
            className={`bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600 ${
              errorCodes.length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            مسح الأكواد
          </button>
        </div>

        {/* حالة النظام */}
        <div className="bg-blue-50 p-3 rounded mb-6 text-center">{status}</div>

        {/* تصنيفات الأعطال */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
          {[
            "all",
            "ignition",
            "fuel",
            "emission",
            "sensors",
            "transmission",
            "electrical",
            "cooling",
            "brakes",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                activeTab === tab ? "bg-green-600 text-white" : "bg-gray-200"
              }`}
            >
              {getTabName(tab)}
            </button>
          ))}
        </div>

        {/* عرض الأكواد */}
        {filteredCodes.length > 0 ? (
          <div className="space-y-3">
            {filteredCodes.map((error, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl text-red-600">
                      {error.code}
                    </h3>
                    <p className="text-gray-700">{error.description}</p>
                  </div>
                  <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {getTabName(error.category)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {activeTab === "all"
              ? "لا توجد أكواد أعطال"
              : `لا توجد أعطال في قسم ${getTabName(activeTab)}`}
          </div>
        )}
      </div>
    </div>
  );
}
