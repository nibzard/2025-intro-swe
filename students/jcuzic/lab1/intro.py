class Student:
    def __init__(self, name, year):
        self.name = name
        self.year = year
    
    def greet(self):
        print(f"Hello! My name is {self.name} and I'm a {self.year} year student.")


# Example usage:
student1 = Student("Alice", "sophomore")
student1.greet()
