
using System;
using Newtonsoft.Json;
using System.IO;
using System.Net;
using System.Collections.Generic;
using System.Linq;

public class Pizza

{    public List<string> toppings
    {
       get;
       set;
    }
}
public class ToppingCombination
{
    public string toppings;
    public int count;
}

class Program
{
    //public void Main()
   static void Main(string[] args)

    {
        List<Pizza> pizzas = Program.GetPizzas();
        if (pizzas == null) return;
        IEnumerable<ToppingCombination> allToppingCombinations = GetToppingCombinations(pizzas);
    // top 20 most ordered combos
        int top = 20;
        IEnumerable<ToppingCombination> mostPopularToppings = allToppingCombinations.OrderByDescending(ag => ag.count).Take(top);
    // Print
        int i = 1;
        string str = "Rank: {0, 4} \t Times Ordered: {1, 5} \t Toppings: {2} ";
        foreach (ToppingCombination combo in mostPopularToppings)
        {
            Console.WriteLine(String.Format(str, i, combo.count, combo.toppings));
            i++;
        }
        Console.ReadLine();
    }
    // Returns list of pizzas
    static List<Pizza> GetPizzas()
    {
    string url = "http://files.olo.com/pizzas.json";
    HttpWebRequest httpWebRequest = System.Net.WebRequest.Create(url) as HttpWebRequest;

        List<Pizza> pizzas;
        using (HttpWebResponse httpWebResponse = httpWebRequest.GetResponse() as HttpWebResponse)   
        {
            if (httpWebResponse.StatusCode != HttpStatusCode.OK)
            {
                                throw new Exception(string.Format("Server error (HTTP {0}: {1}).", httpWebResponse.StatusCode, httpWebResponse.StatusDescription));
            }
            Stream stream = httpWebResponse.GetResponseStream();
            string json = new StreamReader(stream).ReadToEnd();
            stream.Close();
            // should add some error checking here
            pizzas = JsonConvert.DeserializeObject<List<Pizza>>(json);
        }
        return pizzas;
    }
    // Aggregates all topping combinations from list of pizzas
    // Returns each combination and count of each
    static IEnumerable<ToppingCombination> GetToppingCombinations(List<Pizza> pizzas)
    {
        // Order toppings so we can group them
        var orderedPizzaToppings = pizzas.Select(p => p.toppings.OrderBy(t => t));
        // Aggregate toppings list into a comma delimited string
        IEnumerable<string> aggregatedToppings = orderedPizzaToppings.Select((toppings => toppings.Aggregate((x, y) => x + "," + y)));
        // Group toppings and get counts of each
        IEnumerable<ToppingCombination> groupedToppings = aggregatedToppings
        .GroupBy(toppingsGroup => toppingsGroup)
        .Select(toppingsGroup => new ToppingCombination()
        {
            toppings = toppingsGroup.Key,
            count = toppingsGroup.Count()
        });
        return groupedToppings;
    }
}