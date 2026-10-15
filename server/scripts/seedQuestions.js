require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../src/models/Question');

// 15 questions per section (10 sections = 150 total)
// Topic: General Knowledge / Science / Math / History / etc.
const sectionTopics = {
  1: 'Mathematics',
  2: 'Science & Physics',
  3: 'Chemistry',
  4: 'Biology',
  5: 'History',
  6: 'Geography',
  7: 'Literature',
  8: 'Technology & Computing',
  9: 'Sports',
  10: 'General Knowledge',
};

const questionsData = [
  // ─── Section 1: Mathematics ───────────────────────────────────────────────
  { section: 1, questionText: 'What is the value of π (pi) to two decimal places?', options: ['3.14', '3.16', '3.12', '3.18'], correctAnswer: 0 },
  { section: 1, questionText: 'What is 12² (12 squared)?', options: ['124', '144', '132', '148'], correctAnswer: 1 },
  { section: 1, questionText: 'What is the square root of 144?', options: ['11', '13', '12', '14'], correctAnswer: 2 },
  { section: 1, questionText: 'How many degrees are in a right angle?', options: ['45°', '180°', '360°', '90°'], correctAnswer: 3 },
  { section: 1, questionText: 'What is 15% of 200?', options: ['25', '30', '35', '20'], correctAnswer: 1 },
  { section: 1, questionText: 'What is the sum of interior angles of a triangle?', options: ['90°', '360°', '180°', '270°'], correctAnswer: 2 },
  { section: 1, questionText: 'Which number is prime?', options: ['9', '15', '21', '17'], correctAnswer: 3 },
  { section: 1, questionText: 'What is 2⁸?', options: ['64', '128', '256', '512'], correctAnswer: 2 },
  { section: 1, questionText: 'What is the LCM of 4 and 6?', options: ['8', '24', '12', '18'], correctAnswer: 2 },
  { section: 1, questionText: 'A triangle with all sides equal is called?', options: ['Scalene', 'Isosceles', 'Obtuse', 'Equilateral'], correctAnswer: 3 },
  { section: 1, questionText: 'What is the formula for the area of a circle?', options: ['2πr', 'πr²', 'πd', '2πr²'], correctAnswer: 1 },
  { section: 1, questionText: 'What is 7 × 8?', options: ['54', '63', '56', '48'], correctAnswer: 2 },
  { section: 1, questionText: 'What is the next prime after 11?', options: ['12', '13', '14', '15'], correctAnswer: 1 },
  { section: 1, questionText: 'How many sides does a hexagon have?', options: ['5', '7', '8', '6'], correctAnswer: 3 },
  { section: 1, questionText: 'What is 1000 ÷ 25?', options: ['35', '45', '40', '50'], correctAnswer: 2 },

  // ─── Section 2: Science & Physics ────────────────────────────────────────
  { section: 2, questionText: 'What is the speed of light in vacuum (approx.)?', options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s'], correctAnswer: 0 },
  { section: 2, questionText: 'What is the unit of electric current?', options: ['Volt', 'Ohm', 'Watt', 'Ampere'], correctAnswer: 3 },
  { section: 2, questionText: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correctAnswer: 2 },
  { section: 2, questionText: 'What force keeps planets in orbit around the sun?', options: ['Magnetic force', 'Gravity', 'Nuclear force', 'Friction'], correctAnswer: 1 },
  { section: 2, questionText: 'What is Newton\'s second law?', options: ['F = ma', 'E = mc²', 'P = mv', 'W = Fd'], correctAnswer: 0 },
  { section: 2, questionText: 'What is the boiling point of water at sea level (°C)?', options: ['90', '110', '80', '100'], correctAnswer: 3 },
  { section: 2, questionText: 'Which gas makes up most of Earth\'s atmosphere?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], correctAnswer: 2 },
  { section: 2, questionText: 'What is the SI unit of energy?', options: ['Newton', 'Watt', 'Joule', 'Pascal'], correctAnswer: 2 },
  { section: 2, questionText: 'What type of wave is sound?', options: ['Transverse', 'Electromagnetic', 'Longitudinal', 'Surface'], correctAnswer: 2 },
  { section: 2, questionText: 'How many moons does Earth have?', options: ['0', '2', '3', '1'], correctAnswer: 3 },
  { section: 2, questionText: 'What is the freezing point of water in Fahrenheit?', options: ['0°F', '32°F', '100°F', '212°F'], correctAnswer: 1 },
  { section: 2, questionText: 'What causes rainbows?', options: ['Reflection only', 'Diffraction', 'Refraction & reflection of light', 'Absorption of light'], correctAnswer: 2 },
  { section: 2, questionText: 'Which planet is the largest in our solar system?', options: ['Saturn', 'Neptune', 'Uranus', 'Jupiter'], correctAnswer: 3 },
  { section: 2, questionText: 'What is the unit of frequency?', options: ['Decibel', 'Hertz', 'Watt', 'Joule'], correctAnswer: 1 },
  { section: 2, questionText: 'Which color has the longest wavelength?', options: ['Blue', 'Green', 'Violet', 'Red'], correctAnswer: 3 },

  // ─── Section 3: Chemistry ────────────────────────────────────────────────
  { section: 3, questionText: 'What is the chemical symbol for Gold?', options: ['Gd', 'Go', 'Au', 'Ag'], correctAnswer: 2 },
  { section: 3, questionText: 'What is the atomic number of Carbon?', options: ['8', '12', '6', '14'], correctAnswer: 2 },
  { section: 3, questionText: 'What is H₂O commonly known as?', options: ['Hydrogen', 'Oxygen', 'Salt water', 'Water'], correctAnswer: 3 },
  { section: 3, questionText: 'Which element has the symbol Na?', options: ['Nitrogen', 'Sodium', 'Neon', 'Nickel'], correctAnswer: 1 },
  { section: 3, questionText: 'What is the pH of a neutral solution?', options: ['0', '14', '7', '1'], correctAnswer: 2 },
  { section: 3, questionText: 'Which gas is produced when acids react with metals?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], correctAnswer: 3 },
  { section: 3, questionText: 'What is the chemical formula for table salt?', options: ['KCl', 'MgCl₂', 'NaCl', 'CaCl₂'], correctAnswer: 2 },
  { section: 3, questionText: 'Which is the most electronegative element?', options: ['Oxygen', 'Chlorine', 'Neon', 'Fluorine'], correctAnswer: 3 },
  { section: 3, questionText: 'What type of bond holds NaCl together?', options: ['Covalent', 'Hydrogen', 'Metallic', 'Ionic'], correctAnswer: 3 },
  { section: 3, questionText: 'What is the lightest element?', options: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'], correctAnswer: 1 },
  { section: 3, questionText: 'Which state of matter has definite volume but no definite shape?', options: ['Solid', 'Gas', 'Plasma', 'Liquid'], correctAnswer: 3 },
  { section: 3, questionText: 'What is the chemical symbol for Iron?', options: ['Ir', 'In', 'Fe', 'Fr'], correctAnswer: 2 },
  { section: 3, questionText: 'What is the process of a solid turning directly into gas?', options: ['Evaporation', 'Condensation', 'Sublimation', 'Deposition'], correctAnswer: 2 },
  { section: 3, questionText: 'How many electrons can the first electron shell hold?', options: ['8', '4', '18', '2'], correctAnswer: 3 },
  { section: 3, questionText: 'What is an acid\'s characteristic taste?', options: ['Sweet', 'Bitter', 'Salty', 'Sour'], correctAnswer: 3 },

  // ─── Section 4: Biology ──────────────────────────────────────────────────
  { section: 4, questionText: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], correctAnswer: 2 },
  { section: 4, questionText: 'What is the basic unit of life?', options: ['Tissue', 'Organ', 'Cell', 'Organism'], correctAnswer: 2 },
  { section: 4, questionText: 'How many chromosomes do humans normally have?', options: ['23', '48', '44', '46'], correctAnswer: 3 },
  { section: 4, questionText: 'What carries oxygen in red blood cells?', options: ['Plasma', 'Platelets', 'Haemoglobin', 'Insulin'], correctAnswer: 2 },
  { section: 4, questionText: 'What process do plants use to make food?', options: ['Respiration', 'Photosynthesis', 'Transpiration', 'Digestion'], correctAnswer: 1 },
  { section: 4, questionText: 'Which organ filters blood in the human body?', options: ['Liver', 'Kidney', 'Heart', 'Spleen'], correctAnswer: 1 },
  { section: 4, questionText: 'What is DNA\'s full form?', options: ['Deoxyribonucleic Acid', 'Diribonucleic Acid', 'Deoxyribonaric Acid', 'Deoxyriboacid Nucleic'], correctAnswer: 0 },
  { section: 4, questionText: 'Which vitamin is produced by sunlight exposure?', options: ['Vitamin A', 'Vitamin C', 'Vitamin B12', 'Vitamin D'], correctAnswer: 3 },
  { section: 4, questionText: 'What is the largest organ of the human body?', options: ['Liver', 'Brain', 'Lung', 'Skin'], correctAnswer: 3 },
  { section: 4, questionText: 'Which blood type is the universal donor?', options: ['A', 'B', 'AB', 'O'], correctAnswer: 3 },
  { section: 4, questionText: 'How many chambers does a human heart have?', options: ['2', '3', '4', '5'], correctAnswer: 2 },
  { section: 4, questionText: 'What is the process by which cells divide?', options: ['Meiosis and Mitosis', 'Osmosis', 'Diffusion', 'Fermentation'], correctAnswer: 0 },
  { section: 4, questionText: 'Which organ produces insulin?', options: ['Liver', 'Kidney', 'Stomach', 'Pancreas'], correctAnswer: 3 },
  { section: 4, questionText: 'What does the nervous system consist of?', options: ['Brain & spinal cord only', 'Brain only', 'Spinal cord & peripheral nerves only', 'Brain, spinal cord & peripheral nerves'], correctAnswer: 3 },
  { section: 4, questionText: 'What type of cell do bacteria represent?', options: ['Eukaryotic', 'Prokaryotic', 'Fungal', 'Viral'], correctAnswer: 1 },

  // ─── Section 5: History ──────────────────────────────────────────────────
  { section: 5, questionText: 'In which year did World War II end?', options: ['1943', '1944', '1946', '1945'], correctAnswer: 3 },
  { section: 5, questionText: 'Who was the first President of the United States?', options: ['Abraham Lincoln', 'Thomas Jefferson', 'George Washington', 'John Adams'], correctAnswer: 2 },
  { section: 5, questionText: 'The Great Wall of China was primarily built during which dynasty?', options: ['Tang Dynasty', 'Song Dynasty', 'Ming Dynasty', 'Han Dynasty'], correctAnswer: 2 },
  { section: 5, questionText: 'In which year did the French Revolution begin?', options: ['1776', '1815', '1799', '1789'], correctAnswer: 3 },
  { section: 5, questionText: 'Who discovered America in 1492?', options: ['Amerigo Vespucci', 'Vasco da Gama', 'Ferdinand Magellan', 'Christopher Columbus'], correctAnswer: 3 },
  { section: 5, questionText: 'Which ancient wonder was located in Alexandria?', options: ['Colossus of Rhodes', 'Lighthouse of Alexandria', 'Hanging Gardens', 'Temple of Artemis'], correctAnswer: 1 },
  { section: 5, questionText: 'Who was the last pharaoh of Ancient Egypt?', options: ['Nefertiti', 'Cleopatra VII', 'Tutankhamun', 'Ramesses II'], correctAnswer: 1 },
  { section: 5, questionText: 'The Berlin Wall fell in which year?', options: ['1987', '1991', '1993', '1989'], correctAnswer: 3 },
  { section: 5, questionText: 'Which empire was ruled by Julius Caesar?', options: ['Greek Empire', 'Ottoman Empire', 'Roman Empire', 'Byzantine Empire'], correctAnswer: 2 },
  { section: 5, questionText: 'In which year did India gain independence?', options: ['1945', '1948', '1950', '1947'], correctAnswer: 3 },
  { section: 5, questionText: 'Who wrote the Declaration of Independence?', options: ['Benjamin Franklin', 'George Washington', 'John Adams', 'Thomas Jefferson'], correctAnswer: 3 },
  { section: 5, questionText: 'The Renaissance period originated in which country?', options: ['France', 'Germany', 'Greece', 'Italy'], correctAnswer: 3 },
  { section: 5, questionText: 'Which war was fought between the North and South of the USA?', options: ['Revolutionary War', 'World War I', 'Civil War', 'War of 1812'], correctAnswer: 2 },
  { section: 5, questionText: 'Who was the first man to walk on the moon?', options: ['Buzz Aldrin', 'Yuri Gagarin', 'Michael Collins', 'Neil Armstrong'], correctAnswer: 3 },
  { section: 5, questionText: 'Which country built the Eiffel Tower?', options: ['Belgium', 'Italy', 'Germany', 'France'], correctAnswer: 3 },

  // ─── Section 6: Geography ────────────────────────────────────────────────
  { section: 6, questionText: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Brisbane', 'Canberra'], correctAnswer: 3 },
  { section: 6, questionText: 'Which is the longest river in the world?', options: ['Amazon', 'Mississippi', 'Nile', 'Yangtze'], correctAnswer: 2 },
  { section: 6, questionText: 'Which continent is the largest by area?', options: ['Africa', 'Asia', 'North America', 'Europe'], correctAnswer: 1 },
  { section: 6, questionText: 'What is the capital of Japan?', options: ['Osaka', 'Kyoto', 'Tokyo', 'Hiroshima'], correctAnswer: 2 },
  { section: 6, questionText: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 3 },
  { section: 6, questionText: 'Mount Everest is located in which mountain range?', options: ['Alps', 'Andes', 'Rockies', 'Himalayas'], correctAnswer: 3 },
  { section: 6, questionText: 'Which country has the most natural lakes?', options: ['Russia', 'USA', 'Canada', 'Finland'], correctAnswer: 2 },
  { section: 6, questionText: 'What is the capital of Brazil?', options: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Brasília'], correctAnswer: 3 },
  { section: 6, questionText: 'Which desert is the largest in the world?', options: ['Gobi', 'Sahara', 'Antarctic Desert', 'Arabian'], correctAnswer: 2 },
  { section: 6, questionText: 'The Amazon Rainforest is primarily in which country?', options: ['Colombia', 'Peru', 'Venezuela', 'Brazil'], correctAnswer: 3 },
  { section: 6, questionText: 'What is the smallest country in the world?', options: ['Monaco', 'San Marino', 'Liechtenstein', 'Vatican City'], correctAnswer: 3 },
  { section: 6, questionText: 'Through which countries does the River Nile primarily flow?', options: ['Ethiopia & Sudan', 'Egypt & Libya', 'Sudan & Chad', 'Egypt & Sudan'], correctAnswer: 3 },
  { section: 6, questionText: 'What is the capital city of Canada?', options: ['Toronto', 'Montreal', 'Vancouver', 'Ottawa'], correctAnswer: 3 },
  { section: 6, questionText: 'Which continent has the most countries?', options: ['Asia', 'South America', 'Europe', 'Africa'], correctAnswer: 3 },
  { section: 6, questionText: 'What is the deepest lake in the world?', options: ['Lake Superior', 'Caspian Sea', 'Lake Victoria', 'Lake Baikal'], correctAnswer: 3 },

  // ─── Section 7: Literature ───────────────────────────────────────────────
  { section: 7, questionText: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'John Keats', 'William Shakespeare', 'Christopher Marlowe'], correctAnswer: 2 },
  { section: 7, questionText: 'Who wrote "1984"?', options: ['Aldous Huxley', 'Ray Bradbury', 'George Orwell', 'H.G. Wells'], correctAnswer: 2 },
  { section: 7, questionText: 'In which book would you find the character Sherlock Holmes?', options: ['Dracula', 'The Study in Scarlet', 'The Invisible Man', 'Murder on the Orient Express'], correctAnswer: 1 },
  { section: 7, questionText: 'Who wrote "Pride and Prejudice"?', options: ['Charlotte Brontë', 'Emily Brontë', 'Mary Shelley', 'Jane Austen'], correctAnswer: 3 },
  { section: 7, questionText: 'What is the name of the whale in "Moby Dick"?', options: ['Dick', 'Leviathan', 'Moby', 'White'], correctAnswer: 2 },
  { section: 7, questionText: 'Who authored "The Great Gatsby"?', options: ['Ernest Hemingway', 'John Steinbeck', 'F. Scott Fitzgerald', 'William Faulkner'], correctAnswer: 2 },
  { section: 7, questionText: 'Who wrote the Harry Potter series?', options: ['Suzanne Collins', 'Philip Pullman', 'Roald Dahl', 'J.K. Rowling'], correctAnswer: 3 },
  { section: 7, questionText: 'What is the subtitle of Mary Shelley\'s "Frankenstein"?', options: ['The New Adam', 'The Modern Prometheus', 'The Electric Man', 'The Created One'], correctAnswer: 1 },
  { section: 7, questionText: 'Who wrote "Don Quixote"?', options: ['Lope de Vega', 'Miguel de Cervantes', 'Federico García Lorca', 'Pablo Neruda'], correctAnswer: 1 },
  { section: 7, questionText: 'In which Shakespeare play does the character Ophelia appear?', options: ['Othello', 'Macbeth', 'King Lear', 'Hamlet'], correctAnswer: 3 },
  { section: 7, questionText: 'Who wrote "War and Peace"?', options: ['Fyodor Dostoevsky', 'Anton Chekhov', 'Leo Tolstoy', 'Ivan Turgenev'], correctAnswer: 2 },
  { section: 7, questionText: 'Which novel begins with "Call me Ishmael"?', options: ['Billy Budd', 'Lord Jim', 'The Old Man and the Sea', 'Moby Dick'], correctAnswer: 3 },
  { section: 7, questionText: 'Who wrote "The Odyssey"?', options: ['Sophocles', 'Virgil', 'Aristotle', 'Homer'], correctAnswer: 3 },
  { section: 7, questionText: '"Animal Farm" is an allegory of which revolution?', options: ['French Revolution', 'American Revolution', 'Russian Revolution', 'Industrial Revolution'], correctAnswer: 2 },
  { section: 7, questionText: 'Who wrote "To Kill a Mockingbird"?', options: ['Truman Capote', 'John Steinbeck', 'Harper Lee', 'William Faulkner'], correctAnswer: 2 },

  // ─── Section 8: Technology & Computing ──────────────────────────────────
  { section: 8, questionText: 'What does CPU stand for?', options: ['Computer Processing Unit', 'Core Processing Unit', 'Central Processing Unit', 'Central Program Utility'], correctAnswer: 2 },
  { section: 8, questionText: 'Who co-founded Apple Inc.?', options: ['Bill Gates', 'Elon Musk', 'Steve Jobs', 'Mark Zuckerberg'], correctAnswer: 2 },
  { section: 8, questionText: 'What does HTML stand for?', options: ['Hyper Text Machine Language', 'Hyper Text Markup Language', 'Hyper Transfer Markup Language', 'High Text Markup Language'], correctAnswer: 1 },
  { section: 8, questionText: 'What is the binary representation of the decimal number 10?', options: ['1010', '1100', '1001', '1110'], correctAnswer: 0 },
  { section: 8, questionText: 'Which company developed the Android operating system?', options: ['Apple', 'Microsoft', 'Samsung', 'Google'], correctAnswer: 3 },
  { section: 8, questionText: 'What does "URL" stand for?', options: ['Uniform Resource Locator', 'Universal Resource Link', 'Uniform Retrieval Link', 'Universal Resource Locator'], correctAnswer: 0 },
  { section: 8, questionText: 'What is the name of the first computer virus?', options: ['ILOVEYOU', 'Creeper', 'Melissa', 'Brain'], correctAnswer: 1 },
  { section: 8, questionText: 'How many bits are in one byte?', options: ['4', '16', '8', '32'], correctAnswer: 2 },
  { section: 8, questionText: 'What programming language is known as the "mother of all languages"?', options: ['Fortran', 'COBOL', 'Assembly', 'C'], correctAnswer: 3 },
  { section: 8, questionText: 'What does "AI" stand for?', options: ['Automated Intelligence', 'Artificial Interface', 'Artificial Intelligence', 'Advanced Integration'], correctAnswer: 2 },
  { section: 8, questionText: 'Which protocol is used to send emails?', options: ['FTP', 'HTTP', 'SMTP', 'SSH'], correctAnswer: 2 },
  { section: 8, questionText: 'What does "RAM" stand for?', options: ['Redundant Access Memory', 'Read-only Access Memory', 'Random Access Memory', 'Rapid Access Memory'], correctAnswer: 2 },
  { section: 8, questionText: 'What is the name of Linux\'s mascot?', options: ['Beastie', 'Tux', 'GNU', 'Wilber'], correctAnswer: 1 },
  { section: 8, questionText: 'Which data structure uses LIFO order?', options: ['Queue', 'Tree', 'Stack', 'Linked List'], correctAnswer: 2 },
  { section: 8, questionText: 'What does "SQL" stand for?', options: ['Structured Query Language', 'Sequential Query Language', 'Simple Query Logic', 'Standard Query Library'], correctAnswer: 0 },

  // ─── Section 9: Sports ───────────────────────────────────────────────────
  { section: 9, questionText: 'How many players are there in a standard football (soccer) team?', options: ['10', '12', '9', '11'], correctAnswer: 3 },
  { section: 9, questionText: 'How many Olympic rings are there?', options: ['4', '6', '5', '7'], correctAnswer: 2 },
  { section: 9, questionText: 'In which sport is the "Ashes" series played?', options: ['Rugby', 'Football', 'Cricket', 'Tennis'], correctAnswer: 2 },
  { section: 9, questionText: 'Which country has won the most FIFA World Cup titles?', options: ['Germany', 'Argentina', 'Italy', 'Brazil'], correctAnswer: 3 },
  { section: 9, questionText: 'What is the maximum break in snooker?', options: ['145', '147', '150', '155'], correctAnswer: 1 },
  { section: 9, questionText: 'How many sets are in a standard tennis Grand Slam men\'s final?', options: ['3', '4', '2', '5'], correctAnswer: 3 },
  { section: 9, questionText: 'Which country hosted the 2016 Summer Olympics?', options: ['China', 'UK', 'Australia', 'Brazil'], correctAnswer: 3 },
  { section: 9, questionText: 'In basketball, how many points is a field goal beyond the arc worth?', options: ['1', '2', '4', '3'], correctAnswer: 3 },
  { section: 9, questionText: 'What sport does Roger Federer play?', options: ['Golf', 'Squash', 'Badminton', 'Tennis'], correctAnswer: 3 },
  { section: 9, questionText: 'How many holes are in a standard round of golf?', options: ['9', '12', '18', '24'], correctAnswer: 2 },
  { section: 9, questionText: 'Which country invented the sport of cricket?', options: ['Australia', 'India', 'England', 'South Africa'], correctAnswer: 2 },
  { section: 9, questionText: 'In athletics, how long is a standard marathon?', options: ['40 km', '42.195 km', '41 km', '43 km'], correctAnswer: 1 },
  { section: 9, questionText: 'Which team has won the most NBA titles?', options: ['Golden State Warriors', 'Chicago Bulls', 'Boston Celtics', 'Los Angeles Lakers'], correctAnswer: 2 },
  { section: 9, questionText: 'In which sport would you perform a slam dunk?', options: ['Volleyball', 'Handball', 'Basketball', 'Netball'], correctAnswer: 2 },
  { section: 9, questionText: 'How many players are in a rugby union team?', options: ['13', '11', '14', '15'], correctAnswer: 3 },

  // ─── Section 10: General Knowledge ──────────────────────────────────────
  { section: 10, questionText: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Baht', 'Yen'], correctAnswer: 3 },
  { section: 10, questionText: 'How many colours are in a rainbow?', options: ['5', '6', '8', '7'], correctAnswer: 3 },
  { section: 10, questionText: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Quartz', 'Diamond', 'Sapphire'], correctAnswer: 2 },
  { section: 10, questionText: 'Which instrument has 88 keys?', options: ['Organ', 'Harpsichord', 'Piano', 'Accordion'], correctAnswer: 2 },
  { section: 10, questionText: 'What does "NASA" stand for?', options: ['National Aeronautics and Space Administration', 'National Aeronautics and Science Association', 'National Aviation and Space Agency', 'North American Science Administration'], correctAnswer: 0 },
  { section: 10, questionText: 'How many legs does a spider have?', options: ['6', '10', '8', '12'], correctAnswer: 2 },
  { section: 10, questionText: 'What is the most spoken language in the world by native speakers?', options: ['Spanish', 'Hindi', 'English', 'Mandarin Chinese'], correctAnswer: 3 },
  { section: 10, questionText: 'Which planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mars', 'Mercury'], correctAnswer: 3 },
  { section: 10, questionText: 'What is the tallest animal on Earth?', options: ['Elephant', 'Giraffe', 'Ostrich', 'Camel'], correctAnswer: 1 },
  { section: 10, questionText: 'What is the chemical symbol for water?', options: ['HO₂', 'H₂O₂', 'OH₂', 'H₂O'], correctAnswer: 3 },
  { section: 10, questionText: 'How many continents are there on Earth?', options: ['5', '6', '8', '7'], correctAnswer: 3 },
  { section: 10, questionText: 'Which gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], correctAnswer: 1 },
  { section: 10, questionText: 'Who painted the Mona Lisa?', options: ['Raphael', 'Michelangelo', 'Donatello', 'Leonardo da Vinci'], correctAnswer: 3 },
  { section: 10, questionText: 'What is the fastest land animal?', options: ['Lion', 'Horse', 'Cheetah', 'Greyhound'], correctAnswer: 2 },
  { section: 10, questionText: 'How many seconds are in an hour?', options: ['3000', '3200', '3600', '4000'], correctAnswer: 2 },
];

async function seedQuestions() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await Question.countDocuments();
  if (existing > 0) {
    console.log(`Questions already exist (${existing}). Skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  await Question.insertMany(questionsData);
  console.log(`Seeded ${questionsData.length} questions (${questionsData.length / 10} per section across 10 sections)`);
  await mongoose.disconnect();
}

seedQuestions().catch((err) => {
  console.error(err);
  process.exit(1);
});
