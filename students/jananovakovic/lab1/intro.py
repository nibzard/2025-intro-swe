class Student:
    def __init__(self, name, year):
        self.name = name
        self.year = year

    def greet(self):
        print(f"Hello, my name is {self.name} and I am in year {self.year}.")

# Example usage:
s1 = Student("Jana", 3)
s1.greet()
