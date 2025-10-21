/**
 * Algorithme de justification de texte 
 */

export function justifyText(text: string, lineWidth: number): string {
  const words = text.trim().split(/\s+/)
  
  // Regrouper les mots par ligne
  const lines = groupWordsIntoLines(words, lineWidth)
  
  // Étape 3: Justifier chaque ligne (sauf la dernière)
  const justifiedLines = lines.map((line, index) => {
    const isLastLine = index === lines.length - 1
    return isLastLine ? justifyLastLine(line, lineWidth) : justifyLine(line, lineWidth)
  })
  
  // Étape 4: Joindre les lignes
  return justifiedLines.join('\n')
}

// Fonction helper
function groupWordsIntoLines(words: string[], lineWidth: number): string[][] {
  const lines: string[][] = []
  let currentLine: string[] = []
  let currentLength = 0
  
  for (const word of words) {
    // Calculer la longueur si on ajoute ce mot
    const spaceNeeded = currentLine.length > 0 ? 1 : 0 // espace avant le mot
    const newLength = currentLength + spaceNeeded + word.length
    
    if (newLength <= lineWidth) {
      // Le mot rentre sur la ligne actuelle
      currentLine.push(word)
      currentLength = newLength
    } else {
      // Le mot ne rentre pas, commencer une nouvelle ligne
      if (currentLine.length > 0) {
        lines.push(currentLine)
      }
      currentLine = [word]
      currentLength = word.length
    }
  }
  
  // Ajouter la dernière ligne si elle n'est pas vide
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }
  
  return lines
}
// Fonction helper - À implémenter  
function justifyLine(words: string[], lineWidth: number): string {
  // TODO: implémenter
  return ""
}

// Fonction helper - À implémenter
function justifyLastLine(words: string[], lineWidth: number): string {
  // TODO: implémenter
  return ""
}