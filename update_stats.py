import re

with open('src/components/SynthesisStudio.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '{/* Right Column - Stats & Audio */}'
start_idx = content.find(start_marker)

end_section = '          </div>\n        </div>\n      </div>\n    </div>\n  )\n}'
end_idx = content.find(end_section)

if start_idx == -1 or end_idx == -1:
    print(f"start_idx: {start_idx}, end_idx: {end_idx}")
    print("ERROR: Cannot find markers")
    exit(1)

new_right_column = '''{/* Right Column - Stats & Audio */}
          <div className="lg:col-span-1 space-y-6">
            {/* Audio Player */}
            <div className="space-y-2 bg-gray-900/50 border border-cyan-500/20 rounded-xl p-4 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Reproducci\u00f3n
              </h3>
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-4 flex items-center justify-center min-h-40">
                {audioUrl ? (
                  <div className="w-full space-y-3">
                    <audio src={audioUrl} controls className="w-full accent-cyan-500" autoPlay />
                    <p className="text-xs text-gray-400 text-center">
                      Tokens usados: <span className="text-cyan-400 font-bold">{tokensUsed}</span>
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Volume2 className="w-10 h-10 mx-auto mb-2 opacity-50 animate-pulse" />
                    <p className="text-xs">Aqu\u00ed aparecer\u00e1 el audio</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tokens Dashboard */}
            <div className="bg-gray-900/50 border border-cyan-500/20 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-4">Tokens</h3>
              <div className="flex justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-700" />
                    <circle cx="60" cy="60" r="50" stroke="url(#tokenGradient)" strokeWidth="8" fill="none" strokeLinecap="round"
                      strokeDasharray={`${Math.min(100, (tokens / (totalTokensUsed + tokens || 1)) * 100) * 3.14} 314`}
                      className="transition-all duration-1000 ease-out" />
                    <defs>
                      <linearGradient id="tokenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{tokens}</span>
                    <span className="text-[10px] text-gray-400 uppercase">restantes</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-black text-green-400">{tokens}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Disponibles</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-black text-purple-400">{totalTokensUsed}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Usados</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-black text-cyan-400">{synthesisCount}</div>
                  <div className="text-[10px] text-gray-400 uppercase">S\u00edntesis</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-black text-yellow-400">{synthesisCount > 0 ? (totalTokensUsed / synthesisCount).toFixed(0) : 0}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Promedio</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Uso de tokens</span>
                  <span className="text-cyan-400 font-bold">{Math.min(100, Math.round((totalTokensUsed / (totalTokensUsed + tokens || 1)) * 100))}%</span>
                </div>
                <div className="bg-gray-800 rounded-full h-3 overflow-hidden relative">
                  <div className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min(100, (totalTokensUsed / (totalTokensUsed + tokens || 1)) * 100)}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 text-center">
                  {totalTokensUsed.toLocaleString()} de {(totalTokensUsed + tokens).toLocaleString()} tokens usados
                </p>
              </div>
            </div>

            {/* Activity History */}
            <div className="bg-gray-900/50 border border-cyan-500/20 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" /> Actividad
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Mic2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">S\u00edntesis completadas</p>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                      <div className="bg-cyan-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, synthesisCount * 10)}%` }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-black text-cyan-400">{synthesisCount}</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">Tokens gastados</p>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                      <div className="bg-purple-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (totalTokensUsed / (totalTokensUsed + tokens || 1)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-black text-purple-400">{totalTokensUsed}</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">Promedio por s\u00edntesis</p>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                      <div className="bg-yellow-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, synthesisCount > 0 ? (totalTokensUsed / synthesisCount) : 0)}%` }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-black text-yellow-400">{synthesisCount > 0 ? (totalTokensUsed / synthesisCount).toFixed(0) : 0}</span>
                </div>
              </div>
            </div>
          </div>
'''

content = content[:start_idx] + new_right_column + content[end_idx:]

with open('src/components/SynthesisStudio.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Stats and History updated successfully")
