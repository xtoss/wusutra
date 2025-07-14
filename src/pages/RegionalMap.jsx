import React from "react";
import { motion } from "framer-motion";
import DialectHeatmap from "../components/map/DialectHeatmap";

export default function RegionalMap() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            🗺️ 方言地图
          </h1>
          <p className="text-gray-600 text-lg">
            探索全国各地的方言分布和贡献热度
          </p>
        </motion.div>

        <DialectHeatmap />
      </div>
    </div>
  );
}