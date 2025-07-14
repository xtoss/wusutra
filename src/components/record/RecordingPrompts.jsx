import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight, Loader2 } from "lucide-react";

export default function RecordingPrompts({ prompts, onUsePrompt, selectedPrompt, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-orange-600">正在加载推荐短语...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Lightbulb className="w-5 h-5" />
          推荐短语
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!prompts || prompts.length === 0 ? (
          <div className="text-center py-8 text-orange-600">
            <p>该方言暂无推荐短语</p>
            <p className="text-sm mt-1 text-orange-500">您可以切换方言，或在“管理后台”添加新的提示词。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.slice(0, 6).map((prompt) => (
              <div
                key={prompt.id}
                className={`p-3 rounded-lg border transition-all ${
                  selectedPrompt?.id === prompt.id
                    ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white border-orange-400'
                    : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium mb-1 ${
                      selectedPrompt?.id === prompt.id ? 'text-white' : 'text-orange-900'
                    }`}>
                      {prompt.prompt_text}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          selectedPrompt?.id === prompt.id
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-orange-100 text-orange-700 border-orange-300'
                        }`}
                      >
                        {prompt.dialect}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          selectedPrompt?.id === prompt.id
                            ? 'bg-white/20 text-white border-white/30'
                            : 'border-orange-300 text-orange-600'
                        }`}
                      >
                        {prompt.category}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUsePrompt(prompt)}
                    className={`p-2 ${
                      selectedPrompt?.id === prompt.id
                        ? 'text-white hover:bg-white/20'
                        : 'text-orange-600 hover:text-orange-700 hover:bg-orange-100'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}