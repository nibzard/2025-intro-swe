# Extract and analyze all producers from album data

albums = [
    {"title": "Illmatic", "producer": "DJ Premier, Pete Rock, Q-Tip, L.E.S."},
    {"title": "The Chronic", "producer": "Dr. Dre"},
    {"title": "Ready to Die", "producer": "Sean Combs, Easy Mo Bee"},
    {"title": "ATLiens", "producer": "Organized Noize"},
    {"title": "All Eyez on Me", "producer": "Dr. Dre, Johnny J, Daz Dillinger"},
    {"title": "Enter the Wu-Tang", "producer": "RZA"},
    {"title": "The Low End Theory", "producer": "A Tribe Called Quest"},
    {"title": "Paid in Full", "producer": "Eric B."},
    {"title": "Good Kid, M.A.A.D City", "producer": "Dr. Dre, Hit-Boy, Pharrell Williams"},
    {"title": "It Takes a Nation", "producer": "The Bomb Squad"},
    {"title": "Kind of Blue", "producer": "Teo Macero, Irving Townsend"},
    {"title": "A Love Supreme", "producer": "Bob Thiele"},
    {"title": "Giant Steps", "producer": "Nesuhi Ertegun"},
    {"title": "Time Out", "producer": "Teo Macero"},
    {"title": "Mingus Ah Um", "producer": "Teo Macero"},
    {"title": "The Black Saint", "producer": "Teo Macero"},
    {"title": "Head Hunters", "producer": "David Rubinson, Herbie Hancock"},
    {"title": "Blue Train", "producer": "Alfred Lion"},
    {"title": "Ella & Louis", "producer": "Norman Granz"},
    {"title": "Bitches Brew", "producer": "Teo Macero"},
    {"title": "Dark Side of the Moon", "producer": "Pink Floyd"},
    {"title": "Close to the Edge", "producer": "Yes & Eddy Offord"},
    {"title": "In the Court", "producer": "King Crimson"},
    {"title": "Selling England", "producer": "John Burns & Genesis"},
    {"title": "2112", "producer": "Rush & Terry Brown"},
    {"title": "Fragile", "producer": "Yes & Eddy Offord"},
    {"title": "The Wall", "producer": "Bob Ezrin, David Gilmour, Roger Waters"},
    {"title": "Red", "producer": "King Crimson"},
    {"title": "A Farewell to Kings", "producer": "Rush & Terry Brown"},
    {"title": "Thick as a Brick", "producer": "Ian Anderson & Terry Ellis"},
    {"title": "ELP debut", "producer": "Greg Lake"},
    {"title": "Wish You Were Here", "producer": "Pink Floyd"},
    {"title": "Foxtrot", "producer": "David Hitchcock"},
    {"title": "Moving Pictures", "producer": "Rush & Terry Brown"},
    {"title": "Brain Salad Surgery", "producer": "ELP & Greg Lake"},
    {"title": "Led Zeppelin IV", "producer": "Jimmy Page"},
    {"title": "Abbey Road", "producer": "George Martin"},
    {"title": "Rumours", "producer": "Fleetwood Mac, Ken Caillat, Richard Dashut"},
    {"title": "Back in Black", "producer": "Robert John 'Mutt' Lange"},
    {"title": "Hotel California", "producer": "Bill Szymczyk"},
    {"title": "Who's Next", "producer": "The Who, Glyn Johns"},
    {"title": "Appetite for Destruction", "producer": "Mike Clink"},
    {"title": "Born to Run", "producer": "Bruce Springsteen, Jon Landau, Mike Appel"},
    {"title": "The Joshua Tree", "producer": "Daniel Lanois, Brian Eno"},
    {"title": "Boston", "producer": "Tom Scholz, John Boylan"},
]

# Parse all unique producers
all_producers = set()

for album in albums:
    producers = album["producer"]
    # Split by comma and ampersand
    for separator in [',', '&']:
        producers = producers.replace(separator, '|')
    
    producer_list = [p.strip() for p in producers.split('|')]
    all_producers.update(producer_list)

# Sort and display
producers_sorted = sorted(all_producers)

print("="*80)
print(f"📊 TOTAL UNIQUE PRODUCERS: {len(producers_sorted)}")
print("="*80)
print()

# Categorize producers
solo_artists = []  # Artists who are also producers
legendary_producers = []  # Famous producers likely on Spotify
unknown_producers = []  # Might be hard to find

# Known producer categories
famous_hip_hop = ["Dr. Dre", "DJ Premier", "Pete Rock", "Q-Tip", "RZA", "Pharrell Williams", 
                   "Hit-Boy", "Sean Combs", "The Bomb Squad"]
famous_rock = ["George Martin", "Bob Ezrin", "Brian Eno", "Daniel Lanois"]
jazz_producers = ["Teo Macero", "Alfred Lion", "Bob Thiele", "Norman Granz"]
self_produced = ["Pink Floyd", "King Crimson", "Genesis", "Rush", "Yes", "The Who", 
                 "Fleetwood Mac", "Bruce Springsteen", "A Tribe Called Quest"]

for producer in producers_sorted:
    category = "❓ Unknown"
    
    if any(p in producer for p in famous_hip_hop):
        category = "🎤 Hip-Hop Legend (likely on Spotify)"
    elif any(p in producer for p in famous_rock):
        category = "🎸 Rock Legend"
    elif any(p in producer for p in jazz_producers):
        category = "🎺 Jazz Producer"
    elif any(p in producer for p in self_produced):
        category = "🎵 Self-Produced Artist"
    
    print(f"{category:45} | {producer}")

print()
print("="*80)
print("💡 RECOMMENDATION:")
print("="*80)
print("1. Try Spotify for: Dr. Dre, RZA, Pharrell, Q-Tip, Pete Rock (solo artists)")
print("2. Use Wikipedia for: Teo Macero, George Martin, Bob Ezrin (legendary producers)")
print("3. Placeholder for: Others without images")
print()
print("Would you like me to create a seed script with this hybrid approach?")