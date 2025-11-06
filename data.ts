export interface PredefinedExercise {
  name: string;
  category: string;
  imageUrl: string;
}

const placeholderUrl = (name: string) => `https://placehold.co/150x150/374151/9ca3af?text=${encodeURIComponent(name)}`;

export const predefinedExercises: PredefinedExercise[] = [
  // Treino de Peito (baseado na imagem)
  { name: 'Supino Reto', category: 'Peito', imageUrl: 'https://www.hipertrofia.org/blog/wp-content/uploads/2024/04/barbell-bench-press.gif' },
  { name: 'Supino Inclinado', category: 'Peito', imageUrl: placeholderUrl('Supino Inclinado') },
  { name: 'Supino Sentado', category: 'Peito', imageUrl: placeholderUrl('Supino Sentado') },
  { name: 'Crucifixo Inclinado', category: 'Peito', imageUrl: placeholderUrl('Crucifixo Inclinado') },
  { name: 'Tríceps Corda', category: 'Peito', imageUrl: placeholderUrl('Tríceps Corda') },
  { name: 'Tríceps Testa Pulley', category: 'Peito', imageUrl: placeholderUrl('Tríceps Testa') },
  { name: 'Elevação Lateral', category: 'Peito', imageUrl: placeholderUrl('Elevação Lateral') },
  { name: 'Elevação Frontal', category: 'Peito', imageUrl: placeholderUrl('Elevação Frontal') },
  { name: 'Abdominal Superior', category: 'Peito', imageUrl: placeholderUrl('Abdominal') },
  { name: 'Abdominal Prancha', category: 'Peito', imageUrl: placeholderUrl('Prancha') },

  // Treino de Costas (baseado na imagem)
  { name: 'Puxada Alta', category: 'Costas', imageUrl: 'https://treinototal.com.br/wp-content/uploads/2025/06/puxada-alta-na-polia-pegada-pronada.gif' },
  { name: 'Puxada V', category: 'Costas', imageUrl: placeholderUrl('Puxada V') },
  { name: 'Remada Pulley Baixo', category: 'Costas', imageUrl: 'https://www.mundoboaforma.com.br/wp-content/uploads/2023/06/10471301-puxada-com-pegada-fechada-no-pulley.gif' },
  { name: 'Remada Articulada', category: 'Costas', imageUrl: 'https://www.hipertrofia.org/blog/wp-content/uploads/2024/05/lever-seated-row.gif' },
  { name: 'Rosca Pulley', category: 'Costas', imageUrl: 'https://www.hipertrofia.org/blog/wp-content/uploads/2025/01/triceps-corda-na-polia-alta.gif' },
  { name: 'Rosca Martelo no Pulley', category: 'Costas', imageUrl: 'https://www.hipertrofia.org/blog/wp-content/uploads/2024/08/cable-hammer-curl-with-rope.gif' },
  { name: 'Desenvolvimento Halter', category: 'Costas', imageUrl: 'https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/desenvolvimento-para-ombros-com-halteres.gif' },
  { name: 'Extensão Lombar', category: 'Costas', imageUrl: placeholderUrl('Extensão Lombar') },

  // Treino de Perna (baseado na imagem)
  { name: 'Hack Press', category: 'Perna', imageUrl: 'https://www.snodesport.com/cdn/shop/files/snodesquatmachine.jpg?v=1729490366&width=720' },
  { name: 'Stiff Pés Separados', category: 'Perna', imageUrl: placeholderUrl('Stiff') },
  { name: 'Extensor', category: 'Perna', imageUrl: placeholderUrl('Cadeira Extensora') },
  { name: 'Flexor', category: 'Perna', imageUrl: placeholderUrl('Cadeira Flexora') },
  { name: 'Elevação da Pelve', category: 'Perna', imageUrl: placeholderUrl('Elevação Pélvica') },
  { name: 'Abdução', category: 'Perna', imageUrl: placeholderUrl('Cadeira Abdutora') },
  { name: 'Panturrilha em pé', category: 'Perna', imageUrl: placeholderUrl('Panturrilha em Pé') },
  { name: 'Panturrilha Sentado', category: 'Perna', imageUrl: 'https://www.hipertrofia.org/blog/wp-content/uploads/2018/10/lever-seated-calf-raise-.gif' },

  // Exercícios de Cardio
  { name: 'Esteira Ergométrica', category: 'Cardio', imageUrl: 'https://img.freepik.com/fotos-premium/exercicio-de-tecnologia-de-fundo-branco-na-esteira-de-png_53876-813127.jpg?semt=ais_hybrid&w=740&q=80' },
  { name: 'Elíptico (Transport)', category: 'Cardio', imageUrl: placeholderUrl('Elíptico') },
  { name: 'Bicicleta Ergométrica', category: 'Cardio', imageUrl: placeholderUrl('Bicicleta') },
  { name: 'Bicicleta de Spinning (Indoor Cycle)', category: 'Cardio', imageUrl: placeholderUrl('Spinning') },
  { name: 'Remo Indoor (Remador)', category: 'Cardio', imageUrl: placeholderUrl('Remo') },
  { name: 'Simulador de Escadas (StairMaster / Escada)', category: 'Cardio', imageUrl: placeholderUrl('Escada') },
];