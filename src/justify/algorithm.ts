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
// Fonction helper - Justifie une ligne normale (pas la dernière)
function justifyLine(words: string[], lineWidth: number): string {
  // Si un seul mot, traiter comme la dernière ligne
  if (words.length === 1) {
    return justifyLastLine(words, lineWidth)
  }
  
  // Calculer les espaces à distribuer
  const totalChars = words.reduce((sum, word) => sum + word.length, 0)
  const totalSpaces = lineWidth - totalChars
  const gaps = words.length - 1 // Nombre d'espaces entre les mots
  
  // Distribuer les espaces uniformément
  const baseSpaces = Math.floor(totalSpaces / gaps)
  const extraSpaces = totalSpaces % gaps
  
  let result = ''
  for (let i = 0; i < words.length; i++) {
    result += words[i]
    
    // Ajouter des espaces (sauf après le dernier mot)
    if (i < words.length - 1) {
      const spacesToAdd = baseSpaces + (i < extraSpaces ? 1 : 0)
      result += ' '.repeat(spacesToAdd)
    }
  }
  
  return result
}

// Fonction helper - Dernière ligne (alignée à gauche)
function justifyLastLine(words: string[], lineWidth: number): string {
  // La dernière ligne n'est PAS justifiée, on ajoute juste des espaces à la fin
  const line = words.join(' ')
  const spacesToAdd = lineWidth - line.length
  return line + ' '.repeat(Math.max(0, spacesToAdd))
}